'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import CodeEditor from '@/components/CodeEditor';
import { getCodeTemplateFromStructured } from '@/lib/functionSignature';

interface Problem {
  id: string;
  title: string;
  description: string;
  exampleInput: string;
  exampleOutput: string;
  functionName: string;
  parameters: string; // JSON string
  returnType: string;
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

// Default templates - will be replaced with function signature when problem loads
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
        
        // Check if saved code has old "solution" pattern - if so, clear it to regenerate
        if (savedCode && (savedCode.includes('def solution') || savedCode.includes('function solution'))) {
          // Check if it's the old pattern with "solution" prefix
          if (savedCode.match(/def solution\w+|function solution\w+/)) {
            // Clear the old code so it regenerates with the cleaned function name
            localStorage.removeItem(`code_${params.id}`);
          } else {
            setCode(savedCode);
          }
        } else if (savedCode) {
          setCode(savedCode);
        }
        
        if (savedLanguage) {
          setLanguage(savedLanguage);
        }
        // Note: Default code will be set from function signature in fetchProblem
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
    
    // Clear test results when switching languages (previous results are for different language)
    setTestResults(null);
    
    // Always reset to default template when switching languages to avoid syntax conflicts
    if (problem?.functionName && problem?.parameters) {
      const params = JSON.parse(problem.parameters);
      const newTemplate = getCodeTemplateFromStructured(problem.functionName, params, problem.returnType, newLanguage);
      setCode(newTemplate);
    } else {
      // No problem definition, use default templates
      const defaultCode = newLanguage === 'javascript' ? DEFAULT_JAVASCRIPT_CODE : DEFAULT_PYTHON_CODE;
      setCode(defaultCode);
    }
  };

  const fetchProblem = async (id: string) => {
    try {
      const response = await fetch(`/api/problems/${id}`);
      if (!response.ok) throw new Error('Failed to fetch problem');
      const data = await response.json();
      setProblem(data);
      
      // If no saved code and no submission being loaded, set code from function definition
      const savedCode = localStorage.getItem(`code_${id}`);
      const submissionId = searchParams?.get('submission');
      const currentLanguage = localStorage.getItem(`language_${id}`) || 'python';
      
      // Always regenerate template if we have function definition (will override old localStorage code with "solution" pattern)
      if (!submissionId && data.functionName && data.parameters) {
        const params = JSON.parse(data.parameters);
        const template = getCodeTemplateFromStructured(data.functionName, params, data.returnType, currentLanguage);
        
        // Only set if there's no saved code, or if saved code has the old "solution" pattern
        if (!savedCode || savedCode.match(/def solution\w+|function solution\w+/)) {
          setCode(template);
          // Update localStorage with the cleaned version
          if (savedCode && savedCode.match(/def solution\w+|function solution\w+/)) {
            localStorage.setItem(`code_${id}`, template);
          }
        }
      }
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
          if (!savedCode && problem?.functionName && problem?.parameters) {
            // Use function definition template if available
            const params = JSON.parse(problem.parameters);
            const template = getCodeTemplateFromStructured(problem.functionName, params, problem.returnType, savedLanguage);
            setCode(template);
          } else if (!savedCode) {
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
          testCases: problem.testCases.map((tc) => ({
            id: tc.id,
            input: tc.input,
            expectedOutput: tc.expectedOutput,
          })),
          functionName: problem.functionName,
          parameters: JSON.parse(problem.parameters),
          returnType: problem.returnType,
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
      <div className="flex min-h-screen items-center justify-center bg-[#1a1a1a]">
        <div className="text-lg text-[#b3b3b3]">Loading problem...</div>
      </div>
    );
  }

  if (error || !problem) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#1a1a1a]">
        <div className="text-center">
          <div className="text-lg text-[#ff3b3b]">{error || 'Problem not found'}</div>
          <Link href="/" className="mt-4 text-[#9333ea] hover:text-[#7c3aed] transition-colors">
            ← Back to Problems
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-3.5rem)] bg-[#1a1a1a]">
      {/* Left Panel - Problem Description */}
      <div className="flex w-1/3 overflow-y-auto border-r border-[#3a3a3a] bg-[#262626]">
        <div className="p-6">
          <div className="mb-4">
            <Link
              href={`/problems/${problem.id}`}
              className="text-sm text-[#b3b3b3] hover:text-[#9333ea] transition-colors"
            >
              ← Back to Problem
            </Link>
          </div>

          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-semibold text-white">{problem.title}</h1>
              <div className="mt-4 space-y-6">
                <div>
                  <h2 className="text-base font-medium text-white">Description</h2>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-[#b3b3b3]">
                    {problem.description}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-xs font-medium text-[#888888] uppercase tracking-wide">Example Input</h3>
                    <pre className="mt-2 rounded-md bg-[#1a1a1a] border border-[#3a3a3a] p-3 text-xs text-[#e5e5e5] font-mono">
                      {problem.exampleInput}
                    </pre>
                  </div>
                  <div>
                    <h3 className="text-xs font-medium text-[#888888] uppercase tracking-wide">Example Output</h3>
                    <pre className="mt-2 rounded-md bg-[#1a1a1a] border border-[#3a3a3a] p-3 text-xs text-[#e5e5e5] font-mono">
                      {problem.exampleOutput}
                    </pre>
                  </div>
                </div>

                {problem.testCases && problem.testCases.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <h3 className="text-sm font-medium text-white">
                        Test Cases
                      </h3>
                      <span className="rounded-full bg-[#9333ea] px-2.5 py-0.5 text-xs font-medium text-white">
                        {problem.testCases.length}
                      </span>
                    </div>
                    <div className={`space-y-2 ${problem.testCases.length > 10 ? 'max-h-[400px] overflow-y-auto pr-2' : ''}`}>
                      {problem.testCases.map((testCase, index) => (
                        <div
                          key={testCase.id}
                          className="rounded-md border border-[#3a3a3a] bg-[#1a1a1a] p-3"
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <span className="rounded-full bg-[#9333ea] px-2 py-0.5 text-xs font-medium text-white">
                              {index + 1}
                            </span>
                            <span className="text-xs font-medium text-white">Test Case</span>
                          </div>
                          <div className="space-y-2 text-xs">
                            <div>
                              <p className="font-medium text-[#b3b3b3] mb-1">Input:</p>
                              <pre className="rounded bg-[#262626] border border-[#3a3a3a] p-2 text-[#e5e5e5] font-mono overflow-x-auto whitespace-pre-wrap break-words">
                                {testCase.input}
                              </pre>
                            </div>
                            <div>
                              <p className="font-medium text-[#b3b3b3] mb-1">Expected Output:</p>
                              <pre className="rounded bg-[#262626] border border-[#3a3a3a] p-2 text-[#e5e5e5] font-mono overflow-x-auto whitespace-pre-wrap break-words">
                                {testCase.expectedOutput}
                              </pre>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Code Editor and Test Results */}
      <div className="flex w-2/3 flex-col border-l border-[#3a3a3a] bg-[#1a1a1a]">
        {/* Code Editor Section */}
        <div className="flex-1 flex flex-col border-b border-[#3a3a3a]">
          <div className="flex items-center justify-between border-b border-[#3a3a3a] bg-[#262626] px-4 py-2">
            <h2 className="text-sm font-medium text-white">Code</h2>
            <select
              className="rounded-md border border-[#3a3a3a] bg-[#1a1a1a] px-3 py-1 text-xs text-white focus:border-[#9333ea] focus:outline-none"
              value={language}
              onChange={(e) => handleLanguageChange(e.target.value)}
            >
              <option value="python" className="bg-[#1a1a1a]">Python3</option>
              <option value="javascript" className="bg-[#1a1a1a]">JavaScript</option>
            </select>
          </div>

          <div className="flex-1 overflow-hidden">
            <CodeEditor
              value={code}
              onChange={(value) => setCode(value || '')}
              language={language === 'javascript' ? 'javascript' : 'python'}
              height="100%"
            />
          </div>

          <div className="border-t border-[#3a3a3a] bg-[#262626] p-3">
            <div className="flex items-center justify-end gap-2">
              <button
                className="rounded-md border border-[#3a3a3a] bg-[#1a1a1a] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#262626] disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleClear}
                disabled={running || submitting}
              >
                Clear
              </button>
              <button
                className="rounded-md bg-[#9333ea] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#7c3aed] disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleRunTests}
                disabled={running || submitting}
              >
                {running ? 'Running...' : 'Run'}
              </button>
              <button
                className="rounded-md bg-[#00b8a3] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#00a693] disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleSubmit}
                disabled={!testResults || submitting || running}
                title={!testResults ? 'Run tests first before submitting' : ''}
              >
                {submitting ? 'Submitting...' : 'Submit'}
              </button>
            </div>
          </div>
        </div>

        {/* Test Results Section */}
        <div className="flex h-[40%] flex-col border-t border-[#3a3a3a]">
          <div className="border-b border-[#3a3a3a] bg-[#262626] px-4 py-2">
            <h3 className="text-sm font-medium text-white">Test Results</h3>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4">
            {!testResults ? (
              <p className="text-sm text-[#888888]">
                Run tests to see results here
              </p>
            ) : (
              <div className="space-y-3">
                {/* Summary */}
                <div className={`rounded-md border p-3 ${
                  testResults.summary.allPassed 
                    ? 'border-[#00b8a3] bg-[#00b8a3]/10' 
                    : 'border-[#ff3b3b] bg-[#ff3b3b]/10'
                }`}>
                  <p className={`text-sm font-medium ${
                    testResults.summary.allPassed ? 'text-[#00b8a3]' : 'text-[#ff3b3b]'
                  }`}>
                    {testResults.summary.allPassed ? '✓ All tests passed!' : '✗ Some tests failed'}
                  </p>
                  <p className={`text-xs mt-1 ${
                    testResults.summary.allPassed ? 'text-[#00b8a3]' : 'text-[#ff3b3b]'
                  }`}>
                    {testResults.summary.passed} / {testResults.summary.total} test cases passed
                  </p>
                </div>

                {/* Individual Results */}
                {testResults.results.map((result, index) => (
                  <div
                    key={result.testCaseId}
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
                          <p className="font-medium text-[#b3b3b3] mb-1">Expected:</p>
                          <pre className="rounded bg-[#1a1a1a] border border-[#3a3a3a] p-2 text-[#e5e5e5] font-mono overflow-x-auto">{result.expectedOutput}</pre>
                        </div>
                        <div>
                          <p className="font-medium text-[#b3b3b3] mb-1">Got:</p>
                          <pre className="rounded bg-[#1a1a1a] border border-[#3a3a3a] p-2 text-[#e5e5e5] font-mono overflow-x-auto">{result.actualOutput || '(no output)'}</pre>
                        </div>
                        {result.errorMessage && (
                          <div>
                            <p className="font-medium text-[#ff3b3b] mb-1">Error:</p>
                            <pre className="rounded bg-[#1a1a1a] border border-[#3a3a3a] p-2 text-[#ff3b3b] font-mono overflow-x-auto">{result.errorMessage}</pre>
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
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

