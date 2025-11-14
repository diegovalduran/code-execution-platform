import { NextResponse } from 'next/server';
import axios from 'axios';

const PISTON_API = 'https://emkc.org/api/v2/piston';

interface TestCase {
  id: string;
  input: string;
  expectedOutput: string;
}

interface ExecuteRequest {
  code: string;
  language: string;
  testCases: TestCase[];
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
    const { code, language = 'python', testCases } = body;

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
        // Generate language-specific test execution code
        let codeWithTestExecution: string;
        let fileName: string;
        let pistonLanguage: string;

        if (language === 'javascript' || language === 'js') {
          // JavaScript execution
          codeWithTestExecution = `${code}

// Automatically injected test execution
try {
    const test_input = ${testCase.input};
    
    // Call solution with unpacked arguments
    let result;
    if (Array.isArray(test_input) && test_input.length > 0) {
        result = solution(...test_input);
    } else if (Array.isArray(test_input)) {
        result = solution(test_input);
    } else {
        result = solution(test_input);
    }
    
    // Print result as JSON
    console.log(JSON.stringify(result));
} catch (e) {
    console.error('Error:', e.message);
    console.error(e.stack);
}`;
          fileName = 'solution.js';
          pistonLanguage = 'javascript';
        } else {
          // Python execution (default)
          codeWithTestExecution = `${code}

# Automatically injected test execution
try:
    import json
    test_input = ${testCase.input}
    
    # Call solution with unpacked arguments
    if isinstance(test_input, list):
        result = solution(*test_input)
    else:
        result = solution(test_input)
    
    # Print result as JSON for consistency
    print(json.dumps(result) if isinstance(result, (list, dict)) else result)
except Exception as e:
    print(f"Error: {e}")
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
        
        // Clean up output
        const actualOutput = output.trim();
        const expectedOutput = testCase.expectedOutput.trim();

        // Compare outputs - handle arrays that might be in different order
        let passed = false;
        try {
          const actualParsed = JSON.parse(actualOutput);
          const expectedParsed = JSON.parse(expectedOutput);
          
          // If both are arrays, sort before comparing
          if (Array.isArray(actualParsed) && Array.isArray(expectedParsed)) {
            passed = JSON.stringify(actualParsed.slice().sort()) === JSON.stringify(expectedParsed.slice().sort()) && !stderr;
          } else {
            passed = actualOutput === expectedOutput && !stderr;
          }
        } catch {
          // Not JSON parseable, do exact string comparison
          passed = actualOutput === expectedOutput && !stderr;
        }

        results.push({
          testCaseId: testCase.id,
          passed,
          actualOutput,
          expectedOutput,
          errorMessage: stderr || undefined,
          executionTime,
        });
      } catch (error) {
        console.error('Execution error:', error);
        results.push({
          testCaseId: testCase.id,
          passed: false,
          actualOutput: '',
          expectedOutput: testCase.expectedOutput,
          errorMessage: 'Execution failed',
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

