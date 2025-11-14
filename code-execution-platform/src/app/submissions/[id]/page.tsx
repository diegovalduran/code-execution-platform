'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import CodeEditor from '@/components/CodeEditor';
import StatusBadge from '@/components/StatusBadge';
import TestResultsPanel from '@/components/TestResultsPanel';
import ProblemDetails from '@/components/ProblemDetails';

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
        {submission.reviewerNotes && (
          <div className="mt-4 rounded-md bg-gray-50 p-4">
            <h3 className="text-sm font-semibold text-gray-900">Reviewer Notes</h3>
            <p className="mt-1 text-sm text-gray-700">{submission.reviewerNotes}</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Left: Test Results */}
        <TestResultsPanel testResults={submission.testResults} />

        {/* Right: Code */}
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Your Solution</h2>
            <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
              {submission.language === 'javascript' ? 'JavaScript' : 'Python'}
            </span>
          </div>
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

