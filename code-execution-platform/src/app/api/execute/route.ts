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
        // Modify code to use the test case input
        const codeWithInput = `${code}\n\n# Test input\ntest_input = ${testCase.input}`;

        const response = await axios.post(`${PISTON_API}/execute`, {
          language: language === 'python' ? 'python' : language,
          version: '*',
          files: [
            {
              name: 'solution.py',
              content: codeWithInput,
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

        results.push({
          testCaseId: testCase.id,
          passed: actualOutput === expectedOutput && !stderr,
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

