'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import TestCaseManager from '@/components/TestCaseManager';

interface Problem {
  id: string;
  title: string;
  description: string;
  exampleInput: string;
  exampleOutput: string;
  createdAt: string;
  testCases: Array<{
    id: string;
    input: string;
    expectedOutput: string;
  }>;
}

export default function ProblemDetail() {
  const params = useParams();
  const router = useRouter();
  const [problem, setProblem] = useState<Problem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (params.id) {
      fetchProblem(params.id as string);
    }
  }, [params.id]);

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

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this problem?')) return;

    try {
      const response = await fetch(`/api/problems/${params.id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete problem');
      router.push('/');
    } catch (err) {
      alert('Failed to delete problem');
      console.error(err);
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
          href="/"
          className="text-sm text-indigo-600 hover:text-indigo-500"
        >
          ← Back to Problems
        </Link>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{problem.title}</h1>
            <p className="mt-2 text-sm text-gray-500">
              Created {new Date(problem.createdAt).toLocaleDateString()}
            </p>
          </div>
          <button
            onClick={handleDelete}
            className="rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500"
          >
            Delete
          </button>
        </div>

        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Description</h2>
            <p className="mt-2 whitespace-pre-wrap text-gray-700">
              {problem.description}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Example Input</h3>
              <pre className="mt-2 rounded-md bg-gray-50 p-4 text-sm">
                {problem.exampleInput}
              </pre>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Example Output</h3>
              <pre className="mt-2 rounded-md bg-gray-50 p-4 text-sm">
                {problem.exampleOutput}
              </pre>
            </div>
          </div>

          <TestCaseManager
            problemId={problem.id}
            testCases={problem.testCases || []}
            onTestCaseAdded={() => fetchProblem(params.id as string)}
            onTestCaseDeleted={() => fetchProblem(params.id as string)}
            problemDescription={problem.description}
            exampleInput={problem.exampleInput}
            exampleOutput={problem.exampleOutput}
          />

          <div className="border-t border-gray-200 pt-6">
            <Link
              href={`/problems/${problem.id}/solve`}
              className="inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
            >
              Solve This Problem
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

