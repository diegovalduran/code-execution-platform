'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

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

const getStatusColor = (status: string) => {
  switch (status) {
    case 'approved':
      return 'bg-green-100 text-green-800';
    case 'rejected':
      return 'bg-red-100 text-red-800';
    case 'pending':
      return 'bg-yellow-100 text-yellow-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'approved':
      return 'Approved';
    case 'rejected':
      return 'Rejected';
    case 'pending':
      return 'Pending Review';
    default:
      return status;
  }
};

export default function SubmissionsPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    try {
      const response = await fetch('/api/submissions');
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

      {submissions.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 p-12 text-center">
          <h3 className="text-lg font-medium text-gray-900">No submissions yet</h3>
          <p className="mt-2 text-gray-600">
            Submit a solution to see it here
          </p>
          <Link
            href="/"
            className="mt-4 inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
          >
            Browse Problems
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {submissions.map((submission) => (
            <Link
              key={submission.id}
              href={`/submissions/${submission.id}`}
              className="block rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {submission.problem.title}
                    </h3>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(
                        submission.status
                      )}`}
                    >
                      {getStatusLabel(submission.status)}
                    </span>
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
                <div className="ml-4 text-sm text-gray-500">
                  View Details →
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

