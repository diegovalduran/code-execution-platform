'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import CodeEditor from '@/components/CodeEditor';
import StatusBadge from '@/components/StatusBadge';
import TestResultsPanel from '@/components/TestResultsPanel';
import ReviewPanel from '@/components/ReviewPanel';
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

export default function AdminSubmissionDetail() {
  const params = useParams();
  const router = useRouter();
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reviewerNotes, setReviewerNotes] = useState('');
  const [processing, setProcessing] = useState(false);

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
      router.push('/admin');
    } catch (err) {
      console.error('Error reviewing submission:', err);
      alert('Failed to review submission. Please try again.');
    } finally {
      setProcessing(false);
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

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Left: Test Results */}
        <TestResultsPanel testResults={submission.testResults} />

        {/* Right: Code and Review Actions */}
        <div className="space-y-4">
          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">Solution Code</h2>
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

