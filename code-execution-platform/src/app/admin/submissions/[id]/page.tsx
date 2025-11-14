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
          <Link href="/admin" className="mt-4 text-indigo-600 hover:text-indigo-500">
            ← Back to Admin
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <Link
          href="/admin"
          className="text-sm text-indigo-600 hover:text-indigo-500"
        >
          ← Back to Admin
        </Link>
      </div>

      <div className="mb-6">
        <div className="mb-2 flex items-center gap-3">
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
        <ProblemDetails
          title={submission.problem.title}
          description={submission.problem.description}
          exampleInput={submission.problem.exampleInput}
          exampleOutput={submission.problem.exampleOutput}
          problemId={submission.problem.id}
        />
      </div>

      {/* Test Case Management */}
      {problem && (
        <div className="mb-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Manage Test Cases</h2>
          <TestCaseManager
            problemId={problem.id}
            testCases={problem.testCases}
            onTestCaseAdded={async () => {
              // Refresh problem data
              const problemResponse = await fetch(`/api/problems/${problem.id}`);
              if (problemResponse.ok) {
                const problemData = await problemResponse.json();
                setProblem(problemData);
              }
            }}
            onTestCaseDeleted={async () => {
              // Refresh problem data
              const problemResponse = await fetch(`/api/problems/${problem.id}`);
              if (problemResponse.ok) {
                const problemData = await problemResponse.json();
                setProblem(problemData);
              }
            }}
          />
          <div className="mt-4">
            <button
              onClick={handleRerunTests}
              disabled={rerunning || !problem.testCases || problem.testCases.length === 0}
              className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50"
            >
              {rerunning ? 'Re-running Tests...' : 'Re-run Tests with Current Test Cases'}
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Left: Test Results */}
        <div className="space-y-4">
          <TestResultsPanel testResults={rerunResults || submission.testResults} />
          {rerunResults && (
            <div className="rounded-md bg-blue-50 p-3">
              <p className="text-sm font-medium text-blue-800">
                ⚠️ Re-run results with updated test cases
              </p>
              <p className="mt-1 text-xs text-blue-600">
                Showing results from re-running submission code against current test cases
              </p>
            </div>
          )}
        </div>

        {/* Right: Code and Review Actions */}
        <div className="space-y-4">
          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Solution Code</h2>
              <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
                {submission.language === 'javascript' ? 'JavaScript' : 'Python'}
              </span>
            </div>
            <CodeEditor
              value={submission.code}
              onChange={() => {}}
              language={submission.language}
              readOnly={true}
              height="400px"
            />
          </div>

          <ReviewPanel
            status={submission.status}
            reviewerNotes={reviewerNotes}
            onNotesChange={setReviewerNotes}
            onApprove={() => handleReview('approved')}
            onReject={() => handleReview('rejected')}
            processing={processing}
          />
        </div>
      </div>
    </div>
  );
}

