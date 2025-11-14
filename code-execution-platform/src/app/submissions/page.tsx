'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import StatusBadge from '@/components/StatusBadge';
import StatusFilter from '@/components/StatusFilter';

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
  };
  testResults: Array<{
    id: string;
    passed: boolean;
  }>;
}


export default function SubmissionsPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    fetchSubmissions();
  }, [statusFilter]);

  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      const url = statusFilter === 'all' 
        ? '/api/submissions' 
        : `/api/submissions?status=${statusFilter}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch submissions');
      const data = await response.json();
      setSubmissions(data);
    } catch (err) {
      setError('Failed to load submissions');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getPassedTests = (testResults: Array<{ passed: boolean }>) => {
    return testResults.filter((r) => r.passed).length;
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg text-gray-600">Loading submissions...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Submissions</h1>
        <p className="mt-2 text-gray-600">
          View all your submitted solutions and their review status
        </p>
      </div>

      {/* Status Filter */}
      <div className="mb-6">
        <StatusFilter
          currentFilter={statusFilter}
          onFilterChange={setStatusFilter}
        />
      </div>

      {submissions.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 p-12 text-center">
          <h3 className="text-lg font-medium text-gray-900">
            {statusFilter === 'all' ? 'No submissions yet' : `No ${statusFilter} submissions`}
          </h3>
          <p className="mt-2 text-gray-600">
            {statusFilter === 'all' 
              ? 'Submit a solution to see it here'
              : `You don't have any ${statusFilter} submissions yet`}
          </p>
          {statusFilter === 'all' && (
            <Link
              href="/"
              className="mt-4 inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
            >
              Browse Problems
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {submissions.map((submission) => (
            <div
              key={submission.id}
              className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {submission.problem.title}
                    </h3>
                    <StatusBadge status={submission.status} />
                  </div>
                  <div className="mt-2 flex items-center gap-4 text-sm text-gray-600">
                    <span>
                      Submitted{' '}
                      {new Date(submission.submittedAt).toLocaleDateString()}
                    </span>
                    {submission.reviewedAt && (
                      <span>
                        Reviewed{' '}
                        {new Date(submission.reviewedAt).toLocaleDateString()}
                      </span>
                    )}
                    <span>
                      {getPassedTests(submission.testResults)} /{' '}
                      {submission.testResults.length} tests passed
                    </span>
                  </div>
                  {submission.reviewerNotes && (
                    <p className="mt-2 text-sm text-gray-700">
                      <span className="font-medium">Reviewer Notes:</span>{' '}
                      {submission.reviewerNotes}
                    </p>
                  )}
                </div>
                <div className="ml-4">
                  <Link
                    href={`/problems/${submission.problem.id}/solve?submission=${submission.id}`}
                    className="inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
                  >
                    Edit Solution →
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

