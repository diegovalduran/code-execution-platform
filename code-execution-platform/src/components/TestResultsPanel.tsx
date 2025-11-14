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
    <div className="rounded-lg border border-[#3a3a3a] bg-[#262626] p-4">
      <h2 className="mb-4 text-lg font-semibold text-white">Test Results</h2>
      <div className={`rounded-md border p-3 ${
        passedTests === totalTests 
          ? 'border-[#00b8a3] bg-[#00b8a3]/10' 
          : 'border-[#ff3b3b] bg-[#ff3b3b]/10'
      }`}>
        <p className={`text-sm font-medium ${
          passedTests === totalTests ? 'text-[#00b8a3]' : 'text-[#ff3b3b]'
        }`}>
          {passedTests === totalTests ? '✓ All tests passed!' : '✗ Some tests failed'}
        </p>
        <p className={`text-xs mt-1 ${
          passedTests === totalTests ? 'text-[#00b8a3]' : 'text-[#ff3b3b]'
        }`}>
          {passedTests} / {totalTests} test cases passed
        </p>
      </div>

      <div className="mt-4 space-y-3">
        {testResults.map((result, index) => (
          <div
            key={result.id}
            className={`rounded-md border p-3 ${
              result.passed
                ? 'border-[#00b8a3]/30 bg-[#00b8a3]/5'
                : 'border-[#ff3b3b]/30 bg-[#ff3b3b]/5'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-white">
                Test Case {index + 1}
              </span>
              <span className={`text-xs font-medium ${
                result.passed ? 'text-[#00b8a3]' : 'text-[#ff3b3b]'
              }`}>
                {result.passed ? '✓ PASSED' : '✗ FAILED'}
              </span>
            </div>

            {!result.passed && (
              <div className="mt-3 space-y-2 text-xs">
                <div>
                  <p className="font-medium text-[#b3b3b3] mb-1">Input:</p>
                  <pre className="rounded bg-[#1a1a1a] border border-[#3a3a3a] p-2 text-[#e5e5e5] font-mono overflow-x-auto whitespace-pre-wrap break-words">
                    {result.testCase.input}
                  </pre>
                </div>
                <div>
                  <p className="font-medium text-[#b3b3b3] mb-1">Expected:</p>
                  <pre className="rounded bg-[#1a1a1a] border border-[#3a3a3a] p-2 text-[#e5e5e5] font-mono overflow-x-auto whitespace-pre-wrap break-words">
                    {result.testCase.expectedOutput}
                  </pre>
                </div>
                <div>
                  <p className="font-medium text-[#b3b3b3] mb-1">Got:</p>
                  <pre className="rounded bg-[#1a1a1a] border border-[#3a3a3a] p-2 text-[#e5e5e5] font-mono overflow-x-auto whitespace-pre-wrap break-words">
                    {result.actualOutput || '(no output)'}
                  </pre>
                </div>
                {result.errorMessage && (
                  <div>
                    <p className="font-medium text-[#ff3b3b] mb-1">Error:</p>
                    <pre className="rounded bg-[#1a1a1a] border border-[#3a3a3a] p-2 text-[#ff3b3b] font-mono overflow-x-auto whitespace-pre-wrap break-words">
                      {result.errorMessage}
                    </pre>
                  </div>
                )}
              </div>
            )}

            {result.executionTime && (
              <p className="mt-2 text-xs text-[#888888]">
                Execution time: {result.executionTime}ms
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

