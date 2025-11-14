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

    const prompt = `You are a test case generator for coding problems. Generate exactly ${testCaseCount} diverse test cases including edge cases.

Problem Description:
${problemDescription}

Example Input/Output:
Input: ${exampleInput}
Output: ${exampleOutput}

${existingExamples ? `Existing Test Cases:\n${existingExamples}\n` : ''}

Generate exactly ${testCaseCount} new test cases. For each test case, provide:
1. Input: Use named parameters format: "${paramNames.map(p => `${p} = value`).join(', ')}"
2. Expected Output: The expected output as valid JSON (e.g., [0, 1])

Format your response as a JSON array of objects with "input" and "expectedOutput" fields:
[
  {
    "input": "${paramNames.length >= 2 ? `${paramNames[0]} = [3, 2, 4], ${paramNames[1]} = 6` : `${paramNames[0]} = [1, 2, 3]`}",
    "expectedOutput": "[1, 2]"
  },
  ...
]

Only return the JSON array, no other text.`;

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

    // Validate each test case
    const validTestCases = generatedTestCases
      .filter((tc: any) => tc.input && tc.expectedOutput)
      .map((tc: any) => ({
        input: String(tc.input),
        expectedOutput: String(tc.expectedOutput),
      }));

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

