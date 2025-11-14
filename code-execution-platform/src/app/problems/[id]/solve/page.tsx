'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import CodeEditor from '@/components/CodeEditor';

interface Problem {
  id: string;
  title: string;
  description: string;
  exampleInput: string;
  exampleOutput: string;
  testCases: Array<{
    id: string;
    input: string;
    expectedOutput: string;
  }>;
}

interface TestResult {
  testCaseId: string;
  passed: boolean;
  actualOutput: string;
  expectedOutput: string;
  errorMessage?: string;
  executionTime?: number;
}

interface ExecutionResults {
  results: TestResult[];
  summary: {
    passed: number;
    total: number;
    allPassed: boolean;
  };
}

const DEFAULT_PYTHON_CODE = `def solution():
    # Write your solution here
    # Your function will be called automatically with test inputs
    pass`;

const DEFAULT_JAVASCRIPT_CODE = `function solution() {
    // Write your solution here
    // Your function will be called automatically with test inputs
}`;

export default function SolveProblem() {
  const params = useParams();
  const searchParams = useSearchParams();
  const [problem, setProblem] = useState<Problem | null>(null);
  const [language, setLanguage] = useState<string>('python');
  const [code, setCode] = useState(DEFAULT_PYTHON_CODE);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [running, setRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [testResults, setTestResults] = useState<ExecutionResults | null>(null);

  useEffect(() => {
    if (params.id) {
      fetchProblem(params.id as string);
      
      // Check if we're loading a specific submission
      const submissionId = searchParams?.get('submission');
      if (submissionId) {
        fetchSubmission(submissionId);
      } else {
        // Load saved code and language from localStorage
        const savedCode = localStorage.getItem(`code_${params.id}`);
        const savedLanguage = localStorage.getItem(`language_${params.id}`) || 'python';
        if (savedCode) {
          setCode(savedCode);
        }
        if (savedLanguage) {
          setLanguage(savedLanguage);
          if (!savedCode) {
            // Set default code for selected language
            setCode(savedLanguage === 'javascript' ? DEFAULT_JAVASCRIPT_CODE : DEFAULT_PYTHON_CODE);
          }
        }
      }
    }
  }, [params.id, searchParams]);

  // Save code and language to localStorage whenever they change
  useEffect(() => {
    if (params.id) {
      const defaultCode = language === 'javascript' ? DEFAULT_JAVASCRIPT_CODE : DEFAULT_PYTHON_CODE;
      if (code !== defaultCode) {
        localStorage.setItem(`code_${params.id}`, code);
      }
      localStorage.setItem(`language_${params.id}`, language);
    }
  }, [code, language, params.id]);

  const handleLanguageChange = (newLanguage: string) => {
    setLanguage(newLanguage);
    const defaultCode = newLanguage === 'javascript' ? DEFAULT_JAVASCRIPT_CODE : DEFAULT_PYTHON_CODE;
    // Only reset code if it's still the old default
    if (code === DEFAULT_PYTHON_CODE || code === DEFAULT_JAVASCRIPT_CODE) {
      setCode(defaultCode);
    }
  };

  const fetchProblem = async (id: string) => {
    try {
      const response = await fetch(`/api/problems/${id}`);
      if (!response.ok) throw new Error('Failed to fetch problem');
      const data = await response.json();
      setProblem(data);
    } catch (err) {
      setError('Failed to load problem');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubmission = async (submissionId: string) => {
    try {
      const response = await fetch(`/api/submissions/${submissionId}`);
      if (!response.ok) throw new Error('Failed to fetch submission');
      const data = await response.json();
      // Load the submission's code and language
      setCode(data.code);
      setLanguage(data.language || 'python');
      // Also save to localStorage for this problem
      if (params.id) {
        localStorage.setItem(`code_${params.id}`, data.code);
        localStorage.setItem(`language_${params.id}`, data.language || 'python');
      }
    } catch (err) {
      console.error('Failed to load submission:', err);
      // Fall back to localStorage if submission fetch fails
      if (params.id) {
        const savedCode = localStorage.getItem(`code_${params.id}`);
        const savedLanguage = localStorage.getItem(`language_${params.id}`) || 'python';
        if (savedCode) {
          setCode(savedCode);
        }
        if (savedLanguage) {
          setLanguage(savedLanguage);
          if (!savedCode) {
            setCode(savedLanguage === 'javascript' ? DEFAULT_JAVASCRIPT_CODE : DEFAULT_PYTHON_CODE);
          }
        }
      }
    }
  };

  const handleRunTests = async () => {
    if (!problem || !problem.testCases || problem.testCases.length === 0) {
      alert('No test cases available for this problem');
      return;
    }

    setRunning(true);
    setTestResults(null);

    try {
      const response = await fetch('/api/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          language,
          testCases: problem.testCases,
        }),
      });

      if (!response.ok) throw new Error('Execution failed');

      const results = await response.json();
      setTestResults(results);
    } catch (err) {
      console.error('Error running tests:', err);
      alert('Failed to run tests. Please try again.');
    } finally {
      setRunning(false);
    }
  };

  const handleSubmit = async () => {
    if (!testResults) {
      alert('Please run tests before submitting');
      return;
    }

    if (!testResults.summary.allPassed) {
      const confirm = window.confirm(
        'Not all tests passed. Do you still want to submit for review?'
      );
      if (!confirm) return;
    }

    setSubmitting(true);

    try {
      const response = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          problemId: problem?.id,
          code,
          language,
          testResults: testResults.results,
        }),
      });

      if (!response.ok) throw new Error('Submission failed');

      alert('Solution submitted for review successfully!');
      // Optionally redirect to submissions page
      // router.push('/submissions');
    } catch (err) {
      console.error('Error submitting solution:', err);
      alert('Failed to submit solution. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClear = () => {
    if (confirm('Are you sure you want to clear your code? This cannot be undone.')) {
      const defaultCode = language === 'javascript' ? DEFAULT_JAVASCRIPT_CODE : DEFAULT_PYTHON_CODE;
      setCode(defaultCode);
      setTestResults(null);
      // Clear from localStorage
      if (params.id) {
        localStorage.removeItem(`code_${params.id}`);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg text-gray-600">Loading problem...</div>
      </div>
    );
  }

  if (error || !problem) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="text-lg text-red-600">{error || 'Problem not found'}</div>
          <Link href="/" className="mt-4 text-indigo-600 hover:text-indigo-500">
            ← Back to Problems
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <Link
          href={`/problems/${problem.id}`}
          className="text-sm text-indigo-600 hover:text-indigo-500"
        >
          ← Back to Problem
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Left Panel - Problem Description */}
        <div className="space-y-6">
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <h1 className="text-2xl font-bold text-gray-900">{problem.title}</h1>
            <div className="mt-4 space-y-4">
              <div>
                <h2 className="text-sm font-semibold text-gray-900">Description</h2>
                <p className="mt-2 whitespace-pre-wrap text-sm text-gray-700">
                  {problem.description}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-xs font-semibold text-gray-900">Example Input</h3>
                  <pre className="mt-1 rounded-md bg-gray-50 p-2 text-xs">
                    {problem.exampleInput}
                  </pre>
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-gray-900">Example Output</h3>
                  <pre className="mt-1 rounded-md bg-gray-50 p-2 text-xs">
                    {problem.exampleOutput}
                  </pre>
                </div>
              </div>

              {problem.testCases && problem.testCases.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">
                    Test Cases: {problem.testCases.length}
                  </h3>
                  <p className="mt-1 text-xs text-gray-600">
                    Your solution will be tested against {problem.testCases.length} test case
                    {problem.testCases.length !== 1 ? 's' : ''}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Panel - Code Editor and Actions */}
        <div className="space-y-4">
          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Your Solution</h2>
              <select
                className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
                value={language}
                onChange={(e) => handleLanguageChange(e.target.value)}
              >
                <option value="python">Python</option>
                <option value="javascript">JavaScript</option>
              </select>
            </div>

            <CodeEditor
              value={code}
              onChange={(value) => setCode(value || '')}
              language={language === 'javascript' ? 'javascript' : 'python'}
              height="500px"
            />

            <div className="mt-4 space-y-3">
              <div className="flex gap-3">
                <button
                  className="flex-1 rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50"
                  onClick={handleRunTests}
                  disabled={running || submitting}
                >
                  {running ? 'Running Tests...' : 'Run Tests'}
                </button>
                <button
                  className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-50"
                  onClick={handleClear}
                  disabled={running || submitting}
                >
                  Clear
                </button>
              </div>
              
              {testResults && (
                <button
                  className="w-full rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-500 disabled:opacity-50"
                  onClick={handleSubmit}
                  disabled={submitting || running}
                >
                  {submitting ? 'Submitting...' : 'Submit for Review'}
                </button>
              )}
            </div>
          </div>

          {/* Test Results */}
          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-900">Test Results</h3>
            
            {!testResults ? (
              <p className="mt-2 text-sm text-gray-600">
                Run tests to see results here
              </p>
            ) : (
              <div className="mt-4 space-y-3">
                {/* Summary */}
                <div className={`rounded-md p-3 ${testResults.summary.allPassed ? 'bg-green-50' : 'bg-red-50'}`}>
                  <p className={`text-sm font-medium ${testResults.summary.allPassed ? 'text-green-800' : 'text-red-800'}`}>
                    {testResults.summary.allPassed ? '✓ All tests passed!' : '✗ Some tests failed'}
                  </p>
                  <p className={`text-xs ${testResults.summary.allPassed ? 'text-green-600' : 'text-red-600'}`}>
                    {testResults.summary.passed} / {testResults.summary.total} test cases passed
                  </p>
                </div>

                {/* Individual Results */}
                {testResults.results.map((result, index) => (
                  <div
                    key={result.testCaseId}
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
                          <p className="font-medium text-gray-700">Expected:</p>
                          <pre className="mt-1 rounded bg-white p-2">{result.expectedOutput}</pre>
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
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

