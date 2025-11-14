interface TestResult {
  id: string;
  passed: boolean;
  actualOutput: string | null;
  expectedOutput: string | null;
  errorMessage: string | null;
  executionTime: number | null;
  testCase: {
    id: string;
    input: string;
    expectedOutput: string;
  };
}

interface TestResultsPanelProps {
  testResults: TestResult[];
}

export default function TestResultsPanel({ testResults }: TestResultsPanelProps) {
  const passedTests = testResults.filter((r) => r.passed).length;
  const totalTests = testResults.length;

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold text-gray-900">Test Results</h2>
      <div className={`rounded-md p-3 ${passedTests === totalTests ? 'bg-green-50' : 'bg-red-50'}`}>
        <p className={`text-sm font-medium ${passedTests === totalTests ? 'text-green-800' : 'text-red-800'}`}>
          {passedTests === totalTests ? '✓ All tests passed!' : '✗ Some tests failed'}
        </p>
        <p className={`text-xs ${passedTests === totalTests ? 'text-green-600' : 'text-red-600'}`}>
          {passedTests} / {totalTests} test cases passed
        </p>
      </div>

      <div className="mt-4 space-y-3">
        {testResults.map((result, index) => (
          <div
            key={result.id}
            className={`rounded-md border p-3 ${
              result.passed
                ? 'border-green-200 bg-green-50'
                : 'border-red-200 bg-red-50'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-900">
                Test Case {index + 1}
              </span>
              <span className={`text-xs font-medium ${result.passed ? 'text-green-600' : 'text-red-600'}`}>
                {result.passed ? '✓ PASSED' : '✗ FAILED'}
              </span>
            </div>

            {!result.passed && (
              <div className="mt-2 space-y-2 text-xs">
                <div>
                  <p className="font-medium text-gray-700">Input:</p>
                  <pre className="mt-1 rounded bg-white p-2">{result.testCase.input}</pre>
                </div>
                <div>
                  <p className="font-medium text-gray-700">Expected:</p>
                  <pre className="mt-1 rounded bg-white p-2">{result.testCase.expectedOutput}</pre>
                </div>
                <div>
                  <p className="font-medium text-gray-700">Got:</p>
                  <pre className="mt-1 rounded bg-white p-2">{result.actualOutput || '(no output)'}</pre>
                </div>
                {result.errorMessage && (
                  <div>
                    <p className="font-medium text-red-700">Error:</p>
                    <pre className="mt-1 rounded bg-white p-2 text-red-600">{result.errorMessage}</pre>
                  </div>
                )}
              </div>
            )}

            {result.executionTime && (
              <p className="mt-2 text-xs text-gray-500">
                Execution time: {result.executionTime}ms
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

