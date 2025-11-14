'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import CodeEditor from '@/components/CodeEditor';
import StatusBadge from '@/components/StatusBadge';
import TestResultsPanel from '@/components/TestResultsPanel';
import ReviewPanel from '@/components/ReviewPanel';
import ProblemDetails from '@/components/ProblemDetails';
import TestCaseManager from '@/components/TestCaseManager';

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

interface TestCase {
  id: string;
  input: string;
  expectedOutput: string;
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

interface ProblemWithTestCases {
  id: string;
  title: string;
  description: string;
  exampleInput: string;
  exampleOutput: string;
  functionName: string;
  parameters: string; // JSON string
  returnType: string;
  testCases: TestCase[];
}

export default function AdminSubmissionDetail() {
  const params = useParams();
  const router = useRouter();
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [problem, setProblem] = useState<ProblemWithTestCases | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reviewerNotes, setReviewerNotes] = useState('');
  const [processing, setProcessing] = useState(false);
  const [rerunning, setRerunning] = useState(false);
  const [rerunResults, setRerunResults] = useState<TestResult[] | null>(null);

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
      setReviewerNotes(data.reviewerNotes || '');
      
      // Fetch problem with test cases
      if (data.problem?.id) {
        const problemResponse = await fetch(`/api/problems/${data.problem.id}`);
        if (problemResponse.ok) {
          const problemData = await problemResponse.json();
          setProblem(problemData);
        }
      }
    } catch (err) {
      setError('Failed to load submission');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (status: 'approved' | 'rejected') => {
    if (!submission) return;

    setProcessing(true);

    try {
      const response = await fetch(`/api/submissions/${submission.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          reviewerNotes: reviewerNotes.trim() || null,
        }),
      });

      if (!response.ok) throw new Error('Failed to update submission');

      // Refresh submission data
      await fetchSubmission(submission.id);
      alert(`Submission ${status} successfully!`);
      // Redirect to admin page with filter set to show the new status
      router.push(`/admin?status=${status}`);
    } catch (err) {
      console.error('Error reviewing submission:', err);
      alert('Failed to review submission. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const handleRerunTests = async () => {
    if (!submission || !problem || !problem.testCases || problem.testCases.length === 0) {
      alert('No test cases available to run');
      return;
    }

    setRerunning(true);
    setRerunResults(null);

    try {
          const response = await fetch('/api/execute', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              code: submission.code,
              language: submission.language,
              testCases: problem.testCases,
              functionName: problem.functionName,
          parameters: JSON.parse(problem.parameters),
          returnType: problem.returnType,
            }),
          });

      if (!response.ok) throw new Error('Execution failed');

      const results = await response.json();
      
      // Convert execution results to TestResult format
      const formattedResults: TestResult[] = results.results.map((result: any) => ({
        id: result.testCaseId,
        passed: result.passed,
        actualOutput: result.actualOutput,
        expectedOutput: result.expectedOutput,
        errorMessage: result.errorMessage,
        executionTime: result.executionTime,
        testCase: {
          id: result.testCaseId,
          input: problem.testCases.find(tc => tc.id === result.testCaseId)?.input || '',
          expectedOutput: result.expectedOutput || '',
        },
      }));

      setRerunResults(formattedResults);
    } catch (err) {
      console.error('Error rerunning tests:', err);
      alert('Failed to rerun tests. Please try again.');
    } finally {
      setRerunning(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#1a1a1a]">
        <div className="text-lg text-[#b3b3b3]">Loading submission...</div>
      </div>
    );
  }

  if (error || !submission) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#1a1a1a]">
        <div className="text-center">
          <div className="text-lg text-[#ff3b3b]">{error || 'Submission not found'}</div>
          <Link href="/admin" className="mt-4 text-[#9333ea] hover:text-[#7c3aed] transition-colors">
            ← Back to Admin
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-3.5rem)] bg-[#1a1a1a]">
      {/* Left Panel - Problem Description & Admin Actions */}
      <div className="flex w-2/5 overflow-y-auto border-r border-[#3a3a3a] bg-[#262626]">
        <div className="p-6 w-full">
          <div className="mb-4">
            <Link
              href="/admin"
              className="text-sm text-[#b3b3b3] hover:text-[#9333ea] transition-colors"
            >
              ← Back to Admin
            </Link>
          </div>

          <div className="space-y-6">
            {/* Submission Status */}
            <div className="flex items-center gap-3 pb-4 border-b border-[#3a3a3a]">
              <StatusBadge status={submission.status} />
              <div className="flex flex-col gap-1">
                <span className="text-xs text-[#b3b3b3]">
                  Submitted {new Date(submission.submittedAt).toLocaleString()}
                </span>
                {submission.reviewedAt && (
                  <span className="text-xs text-[#b3b3b3]">
                    Reviewed {new Date(submission.reviewedAt).toLocaleString()}
                  </span>
                )}
              </div>
            </div>

            {/* Problem Details */}
            <div>
              <h1 className="text-2xl font-semibold text-white">{submission.problem.title}</h1>
              <div className="mt-4 space-y-6">
                <div>
                  <h2 className="text-base font-medium text-white">Description</h2>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-[#b3b3b3]">
                    {submission.problem.description}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-xs font-medium text-[#888888] uppercase tracking-wide">Example Input</h3>
                    <pre className="mt-2 rounded-md bg-[#1a1a1a] border border-[#3a3a3a] p-3 text-xs text-[#e5e5e5] font-mono">
                      {submission.problem.exampleInput}
                    </pre>
                  </div>
                  <div>
                    <h3 className="text-xs font-medium text-[#888888] uppercase tracking-wide">Example Output</h3>
                    <pre className="mt-2 rounded-md bg-[#1a1a1a] border border-[#3a3a3a] p-3 text-xs text-[#e5e5e5] font-mono">
                      {submission.problem.exampleOutput}
                    </pre>
                  </div>
                </div>

                {/* Test Cases */}
                {problem && (
                  <div>
                    {/* Test Case Manager - for adding/editing test cases */}
                    <div className="mb-4">
                      <TestCaseManager
                        problemId={problem.id}
                        testCases={problem.testCases || []}
                        onTestCaseAdded={async () => {
                          const problemResponse = await fetch(`/api/problems/${problem.id}`);
                          if (problemResponse.ok) {
                            const problemData = await problemResponse.json();
                            setProblem(problemData);
                          }
                        }}
                        onTestCaseDeleted={async () => {
                          const problemResponse = await fetch(`/api/problems/${problem.id}`);
                          if (problemResponse.ok) {
                            const problemData = await problemResponse.json();
                            setProblem(problemData);
                          }
                        }}
                        problemDescription={problem.description}
                        exampleInput={problem.exampleInput}
                        exampleOutput={problem.exampleOutput}
                        functionName={problem.functionName}
                        parameters={JSON.parse(problem.parameters)}
                        returnType={problem.returnType}
                      />
                    </div>
                  </div>
                )}

                {/* Admin Actions */}
                <div className="pt-4 border-t border-[#3a3a3a]">
                  <h3 className="text-sm font-medium text-white mb-4">Review Actions</h3>
                  
                  {/* Reviewer Notes */}
                  <div className="mb-4">
                    <label
                      htmlFor="reviewerNotes"
                      className="block text-xs font-medium text-[#b3b3b3] mb-2"
                    >
                      Reviewer Notes (Optional)
                    </label>
                    <textarea
                      id="reviewerNotes"
                      rows={4}
                      value={reviewerNotes}
                      onChange={(e) => setReviewerNotes(e.target.value)}
                      className="w-full rounded-md border border-[#3a3a3a] bg-[#1a1a1a] px-3 py-2 text-sm text-white placeholder:text-[#888888] focus:border-[#9333ea] focus:outline-none focus:ring-1 focus:ring-[#9333ea]"
                      placeholder="Add any feedback or notes for the submitter..."
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleReview('approved')}
                      disabled={processing || submission.status !== 'pending'}
                      className="flex-1 rounded-md bg-[#00b8a3] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#00a693] disabled:opacity-50"
                    >
                      {processing ? 'Processing...' : 'Approve'}
                    </button>
                    <button
                      onClick={() => handleReview('rejected')}
                      disabled={processing || submission.status !== 'pending'}
                      className="flex-1 rounded-md bg-[#ff3b3b] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#ff2b2b] disabled:opacity-50"
                    >
                      {processing ? 'Processing...' : 'Reject'}
                    </button>
                  </div>

                  {submission.status !== 'pending' && (
                    <p className="mt-2 text-xs text-[#888888]">
                      This submission has already been reviewed.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Code Editor and Test Results */}
      <div className="flex w-3/5 flex-col border-l border-[#3a3a3a] bg-[#1a1a1a]">
        {/* Code Editor Section */}
        <div className="flex-1 flex flex-col border-b border-[#3a3a3a]">
          <div className="flex items-center justify-between border-b border-[#3a3a3a] bg-[#262626] px-4 py-2">
            <h2 className="text-sm font-medium text-white">Solution Code</h2>
            <span className="rounded-full bg-[#9333ea] px-2.5 py-0.5 text-xs font-medium text-white">
              {submission.language === 'javascript' ? 'JavaScript' : 'Python'}
            </span>
          </div>

          <div className="flex-1 overflow-hidden">
            <CodeEditor
              value={submission.code}
              onChange={() => {}}
              language={submission.language}
              readOnly={true}
              height="100%"
            />
          </div>

          {/* Re-run Tests Button */}
          {problem && problem.testCases && problem.testCases.length > 0 && (
            <div className="border-t border-[#3a3a3a] bg-[#262626] p-3">
              <button
                onClick={handleRerunTests}
                disabled={rerunning}
                className="w-full rounded-md bg-[#9333ea] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#7c3aed] disabled:opacity-50"
              >
                {rerunning ? 'Re-running Tests...' : 'Re-run Tests'}
              </button>
            </div>
          )}
        </div>

        {/* Test Results Section */}
        <div className="flex-1 overflow-y-auto border-t border-[#3a3a3a] bg-[#262626]">
          <div className="p-4">
            {rerunResults && (
              <div className="mb-4 rounded-md border border-[#4a9eff]/30 bg-[#4a9eff]/10 p-3">
                <p className="text-sm font-medium text-[#4a9eff]">
                  ⚠️ Re-run results with updated test cases
                </p>
                <p className="mt-1 text-xs text-[#4a9eff]/80">
                  Showing results from re-running submission code against current test cases
                </p>
              </div>
            )}
            <TestResultsPanel testResults={rerunResults || submission.testResults} />
          </div>
        </div>
      </div>
    </div>
  );
}

