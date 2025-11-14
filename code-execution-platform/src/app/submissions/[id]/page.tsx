'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import CodeEditor from '@/components/CodeEditor';
import StatusBadge from '@/components/StatusBadge';

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

interface Submission {
  id: string;
  code: string;
  language: string;
  status: string;
  submittedAt: string;
  reviewedAt: string | null;
  reviewerNotes: string | null;
  problem: {
    id: string;
    title: string;
    description: string;
    exampleInput: string;
    exampleOutput: string;
  };
  testResults: TestResult[];
}


export default function SubmissionDetail() {
  const params = useParams();
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (params.id) {
      fetchSubmission(params.id as string);
    }
  }, [params.id]);

  const fetchSubmission = async (id: string) => {
    try {
      const response = await fetch(`/api/submissions/${id}`);
      if (!response.ok) throw new Error('Failed to fetch submission');
      const data = await response.json();
      setSubmission(data);
    } catch (err) {
      setError('Failed to load submission');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg text-gray-600">Loading submission...</div>
      </div>
    );
  }

  if (error || !submission) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="text-lg text-red-600">{error || 'Submission not found'}</div>
          <Link href="/submissions" className="mt-4 text-indigo-600 hover:text-indigo-500">
            ← Back to Submissions
          </Link>
        </div>
      </div>
    );
  }

  const passedTests = submission.testResults.filter((r) => r.passed).length;
  const totalTests = submission.testResults.length;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <Link
          href="/submissions"
          className="text-sm text-indigo-600 hover:text-indigo-500"
        >
          ← Back to Submissions
        </Link>
      </div>

      <div className="mb-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">
              {submission.problem.title}
            </h1>
            <div className="mt-2 flex items-center gap-3">
              <StatusBadge status={submission.status} />
              <span className="text-sm text-gray-600">
                Submitted {new Date(submission.submittedAt).toLocaleString()}
              </span>
              {submission.reviewedAt && (
                <span className="text-sm text-gray-600">
                  Reviewed {new Date(submission.reviewedAt).toLocaleString()}
                </span>
              )}
            </div>

            {/* Problem Description */}
            <div className="mt-6 space-y-4">
              <div>
                <h2 className="text-sm font-semibold text-gray-900">Description</h2>
                <p className="mt-2 whitespace-pre-wrap text-sm text-gray-700">
                  {submission.problem.description}
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <h3 className="text-xs font-semibold text-gray-900">Example Input</h3>
                  <pre className="mt-1 rounded-md bg-gray-50 p-2 text-xs">
                    {submission.problem.exampleInput}
                  </pre>
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-gray-900">Example Output</h3>
                  <pre className="mt-1 rounded-md bg-gray-50 p-2 text-xs">
                    {submission.problem.exampleOutput}
                  </pre>
                </div>
              </div>
            </div>
          </div>
          <Link
            href={`/problems/${submission.problem.id}`}
            className="ml-4 text-sm text-indigo-600 hover:text-indigo-500"
          >
            View Problem →
          </Link>
        </div>

        {submission.reviewerNotes && (
          <div className="mt-6 rounded-md bg-gray-50 p-4">
            <h3 className="text-sm font-semibold text-gray-900">Reviewer Notes</h3>
            <p className="mt-1 text-sm text-gray-700">{submission.reviewerNotes}</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Left: Test Results */}
        <div className="space-y-4">
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
              {submission.testResults.map((result, index) => (
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
        </div>

        {/* Right: Code */}
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Your Solution</h2>
          <CodeEditor
            value={submission.code}
            onChange={() => {}}
            language={submission.language}
            readOnly={true}
            height="500px"
          />
        </div>
      </div>
    </div>
  );
}

