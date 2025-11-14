import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || '',
});

interface Parameter {
  name: string;
  type: string;
}

interface GenerateRequest {
  problemId: string;
  problemDescription: string;
  exampleInput: string;
  exampleOutput: string;
  functionName: string;
  parameters: Parameter[];
  returnType: string;
  count?: number;
  existingTestCases: Array<{
    input: string;
    expectedOutput: string;
  }>;
}

export async function POST(request: Request) {
  try {
    const body: GenerateRequest = await request.json();
    const { problemDescription, exampleInput, exampleOutput, functionName, parameters, returnType, count = 5, existingTestCases } = body;
    
    // Validate and clamp count between 1 and 10
    const testCaseCount = Math.min(Math.max(1, count || 5), 10);
    
    // Use structured parameters directly
    const paramNames = parameters.map(p => p.name);

    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json(
        { error: 'GROQ_API_KEY not configured' },
        { status: 500 }
      );
    }

    // Build prompt for LLM
    const existingExamples = existingTestCases
      .slice(0, 3) // Use first 3 as examples
      .map((tc, i) => `Test Case ${i + 1}:\n  Input: ${tc.input}\n  Expected Output: ${tc.expectedOutput}`)
      .join('\n\n');

    // Determine expected output format based on return type
    let outputFormatExample = '';
    let outputFormatInstructions = '';
    
    if (returnType.includes('List') || returnType.includes('list')) {
      outputFormatExample = '[0, 1]';
      outputFormatInstructions = `The expected output MUST be a valid JSON array format like [0, 1], [1, 2, 3], etc. NOT "0, 1" or "1, 2, 3". Always use square brackets [].`;
    } else if (returnType.includes('Dict') || returnType.includes('dict') || returnType.includes('object')) {
      outputFormatExample = '{"key": "value"}';
      outputFormatInstructions = `The expected output MUST be a valid JSON object format like {"key": "value"}. Always use curly braces {}.`;
    } else if (returnType === 'int' || returnType === 'float') {
      outputFormatExample = '42';
      outputFormatInstructions = `The expected output MUST be a number without quotes, like 42 or 3.14.`;
    } else if (returnType === 'bool') {
      outputFormatExample = 'true';
      outputFormatInstructions = `The expected output MUST be a boolean: true or false (lowercase, no quotes).`;
    } else if (returnType === 'str' || returnType === 'string') {
      outputFormatExample = '"hello"';
      outputFormatInstructions = `The expected output MUST be a JSON string with quotes, like "hello" or "world".`;
    } else {
      outputFormatExample = exampleOutput || 'null';
      outputFormatInstructions = `The expected output MUST match the return type "${returnType}" and be valid JSON. Use the example output format as reference: ${exampleOutput}`;
    }

    const prompt = `You are a test case generator for coding problems. Generate exactly ${testCaseCount} diverse test cases including edge cases.

Problem Description:
${problemDescription}

Function Signature:
Function: ${functionName}(${parameters.map(p => `${p.name}: ${p.type}`).join(', ')}) -> ${returnType}

Example Input/Output:
Input: ${exampleInput}
Output: ${exampleOutput}

${existingExamples ? `Existing Test Cases:\n${existingExamples}\n` : ''}

IMPORTANT FORMATTING RULES:
1. Input: Use named parameters format: "${paramNames.map(p => `${p} = value`).join(', ')}"
2. Expected Output: ${outputFormatInstructions}
   Example format: ${outputFormatExample}
   The return type is: ${returnType}
   CRITICAL: The expectedOutput must be valid JSON that matches the return type exactly. For lists, use [1, 2], NOT "1, 2". For objects, use {"key": "value"}, NOT "key: value".

Generate exactly ${testCaseCount} new test cases. Format your response as a JSON array:
[
  {
    "input": "${paramNames.length >= 2 ? `${paramNames[0]} = [3, 2, 4], ${paramNames[1]} = 6` : `${paramNames[0]} = [1, 2, 3]`}",
    "expectedOutput": ${outputFormatExample}
  },
  ...
]

Only return the JSON array, no other text. Each expectedOutput must be valid JSON matching the return type ${returnType}.`;

    // Call Groq API
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant that generates test cases for coding problems. Always respond with valid JSON only.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.7,
      max_tokens: 2000,
    });

    const responseText = completion.choices[0]?.message?.content || '';
    
    // Parse JSON response
    let generatedTestCases;
    try {
      // Try to extract JSON from response (in case there's extra text)
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        generatedTestCases = JSON.parse(jsonMatch[0]);
      } else {
        generatedTestCases = JSON.parse(responseText);
      }
    } catch (parseError) {
      console.error('Failed to parse LLM response:', responseText);
      return NextResponse.json(
        { error: 'Failed to parse generated test cases', rawResponse: responseText },
        { status: 500 }
      );
    }

    // Validate structure
    if (!Array.isArray(generatedTestCases)) {
      return NextResponse.json(
        { error: 'Invalid response format: expected array' },
        { status: 500 }
      );
    }

    // Normalize expected output format based on return type
    const normalizeExpectedOutput = (output: any, returnType: string): string => {
      let normalized = String(output).trim();
      
      // Handle List types - ensure it's a JSON array
      if (returnType.includes('List') || returnType.includes('list')) {
        // If it's already a JSON array string, try to parse and re-stringify to ensure format
        if (normalized.startsWith('[') && normalized.endsWith(']')) {
          try {
            const parsed = JSON.parse(normalized);
            return JSON.stringify(parsed);
          } catch {
            // If parsing fails, return as is
            return normalized;
          }
        }
        
        // If it's comma-separated values like "0, 1" or 0, 1, convert to [0, 1]
        if (normalized.includes(',') && !normalized.startsWith('[')) {
          try {
            // Remove quotes if present
            let clean = normalized;
            if (clean.startsWith('"') && clean.endsWith('"')) {
              clean = clean.slice(1, -1);
            }
            
            const values = clean.split(',').map(v => v.trim());
            // Try to parse as numbers, otherwise keep as strings
            const parsed = values.map(v => {
              // Remove quotes from individual values
              let val = v;
              if (val.startsWith('"') && val.endsWith('"')) {
                val = val.slice(1, -1);
              }
              const num = Number(val);
              return isNaN(num) ? val : num;
            });
            return JSON.stringify(parsed);
          } catch {
            // If parsing fails, wrap in brackets
            return `[${normalized}]`;
          }
        }
        
        // If it's a single value without brackets, wrap in array
        if (!normalized.startsWith('[')) {
          try {
            // Remove quotes if present
            let clean = normalized;
            if (clean.startsWith('"') && clean.endsWith('"')) {
              clean = clean.slice(1, -1);
            }
            
            const num = Number(clean);
            return isNaN(num) ? JSON.stringify([clean]) : JSON.stringify([num]);
          } catch {
            return JSON.stringify([normalized]);
          }
        }
      }
      
      // Handle Dict/Object types - ensure it's a JSON object
      if (returnType.includes('Dict') || returnType.includes('dict') || returnType.includes('object')) {
        if (normalized.startsWith('{') && normalized.endsWith('}')) {
          try {
            const parsed = JSON.parse(normalized);
            return JSON.stringify(parsed);
          } catch {
            return normalized;
          }
        }
      }
      
      // For strings, ensure proper JSON string format
      if (returnType === 'str' || returnType === 'string') {
        if (!normalized.startsWith('"')) {
          return JSON.stringify(normalized);
        }
        try {
          JSON.parse(normalized);
          return normalized;
        } catch {
          return JSON.stringify(normalized);
        }
      }
      
      // For numbers, ensure no quotes
      if (returnType === 'int' || returnType === 'float') {
        if (normalized.startsWith('"') && normalized.endsWith('"')) {
          normalized = normalized.slice(1, -1);
        }
        // Validate it's a number
        if (!isNaN(Number(normalized))) {
          return normalized;
        }
      }
      
      // For booleans, ensure lowercase and no quotes
      if (returnType === 'bool') {
        const lower = normalized.toLowerCase();
        if (lower === 'true' || lower === 'false') {
          return lower;
        }
        if (normalized.startsWith('"') && normalized.endsWith('"')) {
          normalized = normalized.slice(1, -1);
        }
        return normalized.toLowerCase();
      }
      
      // For other types, try to parse as JSON to validate
      try {
        JSON.parse(normalized);
        return normalized;
      } catch {
        // If not valid JSON, return as is (might be a primitive)
        return normalized;
      }
    };

    // Validate each test case
    const validTestCases = generatedTestCases
      .filter((tc: any) => tc.input && tc.expectedOutput)
      .map((tc: any) => {
        const normalizedOutput = normalizeExpectedOutput(tc.expectedOutput, returnType);
        return {
          input: String(tc.input),
          expectedOutput: normalizedOutput,
        };
      });

    if (validTestCases.length === 0) {
      return NextResponse.json(
        { error: 'No valid test cases generated' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      testCases: validTestCases,
      count: validTestCases.length,
    });
  } catch (error) {
    console.error('Error generating test cases:', error);
    return NextResponse.json(
      { error: 'Failed to generate test cases' },
      { status: 500 }
    );
  }
}

