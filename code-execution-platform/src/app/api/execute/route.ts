import { NextResponse } from 'next/server';
import axios from 'axios';
import { parseNamedParameters } from '@/lib/functionSignature';

const PISTON_API = 'https://emkc.org/api/v2/piston';

interface Parameter {
  name: string;
  type: string;
}

interface TestCase {
  id: string;
  input: string;
  expectedOutput: string;
}

interface ExecuteRequest {
  code: string;
  language: string;
  testCases: TestCase[];
  functionName: string;
  parameters: Parameter[];
  returnType: string;
}

interface TestResult {
  testCaseId: string;
  passed: boolean;
  actualOutput: string;
  expectedOutput: string;
  errorMessage?: string;
  executionTime?: number;
}

export async function POST(request: Request) {
  try {
    const body: ExecuteRequest = await request.json();
    const { code, language = 'python', testCases, functionName, parameters, returnType } = body;

    // Clean up function name: remove "solution" completely (as prefix or anywhere)
    let cleanFunctionName = functionName.trim();
    
    // Remove "solution" if it appears at the start
    if (cleanFunctionName.toLowerCase().startsWith('solution')) {
      const afterSolution = cleanFunctionName.substring('solution'.length);
      if (afterSolution.length > 0) {
        cleanFunctionName = afterSolution;
      } else {
        // If it's just "solution", use a default
        cleanFunctionName = 'solve';
      }
    }
    
    // Also remove "solution" if it appears anywhere else (e.g., "twoSumsolution" -> "twoSum")
    cleanFunctionName = cleanFunctionName.replace(/solution/gi, '');
    
    // If we removed everything, use a default
    if (!cleanFunctionName || cleanFunctionName.trim().length === 0) {
      cleanFunctionName = 'solve';
    }

    // Get parameter names from structured parameters
    const paramNames = parameters.map(p => p.name);
    const useNamedParams = paramNames.length > 0;

    if (!code || !testCases || testCases.length === 0) {
      return NextResponse.json(
        { error: 'Missing code or test cases' },
        { status: 400 }
      );
    }

    // Execute code for each test case
    const results: TestResult[] = [];

    for (const testCase of testCases) {
      const startTime = Date.now();

      try {
        // Parse test case input
        let functionCall: string;
        let testInputCode: string;
        
        if (useNamedParams) {
          // Parse named parameters from input string
          const namedParams = parseNamedParameters(testCase.input, paramNames);
          
          if (Object.keys(namedParams).length > 0) {
            // Build function call with named parameters
            if (language === 'javascript' || language === 'js') {
              // For JavaScript, pass parameters as individual arguments, not as an object
              const paramValues = paramNames.map((param: string) => {
                let value = namedParams[param] || 'undefined';
                // Parse JSON string to get actual JavaScript value
                try {
                  const parsed = JSON.parse(value);
                  // Convert to JavaScript format
                  if (Array.isArray(parsed)) {
                    value = '[' + parsed.map(v => 
                      typeof v === 'string' ? `"${v}"` : String(v)
                    ).join(', ') + ']';
                  } else if (typeof parsed === 'object' && parsed !== null) {
                    value = '{' + Object.entries(parsed).map(([k, v]) => 
                      `"${k}": ${typeof v === 'string' ? `"${v}"` : String(v)}`
                    ).join(', ') + '}';
                  } else if (typeof parsed === 'string') {
                    value = `"${parsed}"`;
                  } else if (parsed === null) {
                    value = 'null';
                  } else {
                    value = String(parsed);
                  }
                } catch {
                  // If parsing fails, use value as-is
                }
                return value;
              }).join(', ');
              functionCall = `${cleanFunctionName}(${paramValues})`; // Pass as individual arguments
              testInputCode = `// Named parameters parsed from: ${testCase.input}`;
            } else {
              // Python - convert JSON string values to Python literals
              const paramPairs = paramNames.map((param: string) => {
                let value = namedParams[param] || 'None';
                // Parse JSON string to get actual value, then convert to Python format
                try {
                  const parsed = JSON.parse(value);
                  // Convert to Python literal format
                  if (Array.isArray(parsed)) {
                    // Convert array to Python list format: [1, 2, 3]
                    value = '[' + parsed.map(v => 
                      typeof v === 'string' ? `"${v}"` : String(v)
                    ).join(', ') + ']';
                  } else if (typeof parsed === 'object' && parsed !== null) {
                    // Convert object to Python dict format: {"key": "value"}
                    value = '{' + Object.entries(parsed).map(([k, v]) => 
                      `"${k}": ${typeof v === 'string' ? `"${v}"` : String(v)}`
                    ).join(', ') + '}';
                  } else if (typeof parsed === 'string') {
                    value = `"${parsed}"`;
                  } else if (parsed === null) {
                    value = 'None';
                  } else {
                    value = String(parsed);
                  }
                } catch {
                  // If parsing fails, use value as-is (might already be in Python format)
                }
                return `${param}=${value}`;
              }).join(', ');
              functionCall = `${cleanFunctionName}(${paramPairs})`;
              // Set up test input variables
              testInputCode = `# Named parameters parsed from: ${testCase.input}`;
            }
          } else {
                // Fallback to positional if parsing failed
                if (language === 'javascript' || language === 'js') {
                  testInputCode = `const test_input = ${testCase.input};`;
                  functionCall = `Array.isArray(test_input) && test_input.length > 0 ? ${cleanFunctionName}(...test_input) : ${cleanFunctionName}(test_input)`;
                } else {
                  testInputCode = `test_input = ${testCase.input}`;
                  functionCall = `${cleanFunctionName}(*test_input) if isinstance(test_input, list) else ${cleanFunctionName}(test_input)`;
                }
              }
            } else {
              // Use positional arguments (original behavior)
              if (language === 'javascript' || language === 'js') {
                testInputCode = `const test_input = ${testCase.input};`;
                functionCall = `Array.isArray(test_input) && test_input.length > 0 ? ${functionName}(...test_input) : ${functionName}(test_input)`;
              } else {
                testInputCode = `test_input = ${testCase.input}`;
                functionCall = `${functionName}(*test_input) if isinstance(test_input, list) else ${functionName}(test_input)`;
              }
            }

        // Generate language-specific test execution code
        let codeWithTestExecution: string;
        let fileName: string;
        let pistonLanguage: string;

        if (language === 'javascript' || language === 'js') {
          // JavaScript execution
          codeWithTestExecution = `${code}

// Automatically injected test execution
try {
    ${testInputCode}
    
    // Check if function exists
    if (typeof ${cleanFunctionName} !== 'function') {
        console.log('ERROR: Function ${cleanFunctionName} is not defined or is not a function');
        console.log('DEBUG: Available functions:', Object.keys(globalThis).filter(k => typeof globalThis[k] === 'function').join(', '));
    } else {
        // Call solution
        const result = ${functionCall};
        
        // Print result as JSON
        if (result !== undefined && result !== null) {
            console.log(JSON.stringify(result));
        } else {
            console.log('null');
        }
    }
} catch (e) {
    // Print error to stdout so we can capture it
    console.log('ERROR: ' + e.message);
    if (e.stack) {
        console.log('STACK: ' + e.stack);
    }
}`;
          fileName = 'solution.js';
          pistonLanguage = 'javascript';
        } else {
          // Python execution (default)
          codeWithTestExecution = `${code}

# Automatically injected test execution
import json
${testInputCode}

# Call solution directly
try:
    result = ${functionCall}
    
    # Print result as JSON for consistency
    if result is None:
        print(json.dumps(None))  # This will print "null" in JSON format
    elif isinstance(result, (list, dict, bool, int, float, str)):
        print(json.dumps(result))
    else:
        # For other types, try to convert to string
        print(json.dumps(str(result)))
except NameError as e:
    print(f"ERROR: Function '${cleanFunctionName}' not found - {e}")
    print(f"DEBUG: Available: {[x for x in globals().keys() if not x.startswith('_')]}")
    import traceback
    traceback.print_exc()
except Exception as e:
    print(f"ERROR: {e}")
    import traceback
    traceback.print_exc()
`;
          fileName = 'solution.py';
          pistonLanguage = 'python';
        }

        const response = await axios.post(`${PISTON_API}/execute`, {
          language: pistonLanguage,
          version: '*',
          files: [
            {
              name: fileName,
              content: codeWithTestExecution,
            },
          ],
          stdin: '',
          args: [],
          compile_timeout: 10000,
          run_timeout: 3000,
          compile_memory_limit: -1,
          run_memory_limit: -1,
        });

        const executionTime = Date.now() - startTime;
        const output = response.data.run?.output || response.data.run?.stdout || '';
        const stderr = response.data.run?.stderr || '';
        const exitCode = response.data.run?.code; // Exit code
        
        // Log the full response for debugging
        console.log('Execution response:', {
          output,
          stderr,
          exitCode,
          functionCall,
          cleanFunctionName,
          testCaseInput: testCase.input
        });
        
        // Clean up output - get the last line (the actual result)
        let actualOutput = output.trim();
        const expectedOutput = testCase.expectedOutput.trim();
        
        // Split by newlines and get the last non-empty line (the actual result)
        const outputLines = actualOutput.split('\n').filter((line: string) => line.trim());
        if (outputLines.length > 0) {
          actualOutput = outputLines[outputLines.length - 1].trim();
        }
        
        // Check if there's an error in the output (from our error handling)
        let errorMessage: string | undefined;
        if (output.includes('ERROR:') || output.includes('DEBUG:')) {
          // Extract error message from full output
          const errorMatch = output.match(/ERROR:.*/);
          if (errorMatch) {
            errorMessage = errorMatch[0];
          }
        } else if (stderr) {
          errorMessage = stderr;
        } else if (exitCode && exitCode !== 0) {
          // Non-zero exit code indicates an error
          errorMessage = `Execution failed with exit code ${exitCode}`;
        } else if (!actualOutput && !stderr) {
          // No output and no error - function might not have returned anything
          errorMessage = 'No output from function - function may not have returned a value';
        }
        
        // If actualOutput is "null" (JSON representation of None), show it as "None" for clarity
        if (actualOutput === 'null' && !errorMessage) {
          // Keep it as "null" - it's the JSON representation of None
          // This is what the function actually returned
        }

        // Compare outputs - handle arrays that might be in different order
        let passed = false;
        if (errorMessage) {
          passed = false;
        } else {
          try {
            const actualParsed = JSON.parse(actualOutput);
            const expectedParsed = JSON.parse(expectedOutput);
            
            // If both are arrays, sort before comparing (for problems where order doesn't matter)
            if (Array.isArray(actualParsed) && Array.isArray(expectedParsed)) {
              // For two-sum type problems, both [0,1] and [1,0] are valid
              // Sort both arrays and compare
              const actualSorted = [...actualParsed].sort((a, b) => a - b);
              const expectedSorted = [...expectedParsed].sort((a, b) => a - b);
              passed = JSON.stringify(actualSorted) === JSON.stringify(expectedSorted);
            } else {
              passed = actualOutput === expectedOutput;
            }
          } catch {
            // Not JSON parseable, do exact string comparison
            passed = actualOutput === expectedOutput;
          }
        }

        results.push({
          testCaseId: testCase.id,
          passed,
          actualOutput: actualOutput || '(no output)',
          expectedOutput,
          errorMessage: errorMessage || stderr || undefined,
          executionTime,
        });
      } catch (error: any) {
        console.error('Execution error:', error);
        
        // Extract more detailed error message
        let errorMessage = 'Execution failed';
        if (error.response) {
          // API error (e.g., 429 rate limit)
          const status = error.response.status;
          const statusText = error.response.statusText;
          if (status === 429) {
            errorMessage = 'Rate limit exceeded - please try again in a moment';
          } else {
            errorMessage = `API error (${status}): ${statusText}`;
          }
        } else if (error.message) {
          errorMessage = error.message;
        }
        
        results.push({
          testCaseId: testCase.id,
          passed: false,
          actualOutput: '(no output)',
          expectedOutput: testCase.expectedOutput,
          errorMessage,
          executionTime: Date.now() - startTime,
        });
      }
    }

    // Calculate summary
    const passed = results.filter((r) => r.passed).length;
    const total = results.length;

    return NextResponse.json({
      results,
      summary: {
        passed,
        total,
        allPassed: passed === total,
      },
    });
  } catch (error) {
    console.error('Error executing code:', error);
    return NextResponse.json(
      { error: 'Failed to execute code' },
      { status: 500 }
    );
  }
}

