'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Problem {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  _count: {
    submissions: number;
  };
  testCases: Array<{ id: string }>;
}

export default function Home() {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchProblems();
  }, []);

  const fetchProblems = async () => {
    try {
      const response = await fetch('/api/problems');
      if (!response.ok) throw new Error('Failed to fetch problems');
      const data = await response.json();
      setProblems(data);
    } catch (err) {
      setError('Failed to load problems');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg text-gray-600">Loading problems...</div>
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
        <h1 className="text-3xl font-bold text-gray-900">Coding Problems</h1>
        <p className="mt-2 text-gray-600">
          Select a problem to solve or create a new one
        </p>
      </div>

      {problems.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 p-12 text-center">
          <h3 className="text-lg font-medium text-gray-900">No problems yet</h3>
          <p className="mt-2 text-gray-600">
            Get started by creating your first coding problem
          </p>
          <Link
            href="/problems/new"
            className="mt-4 inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
          >
            Create Problem
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {problems.map((problem) => (
            <Link
              key={problem.id}
              href={`/problems/${problem.id}`}
              className="block rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
            >
              <h3 className="text-lg font-semibold text-gray-900">
                {problem.title}
              </h3>
              <p className="mt-2 line-clamp-2 text-sm text-gray-600">
                {problem.description}
              </p>
              <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
                <span>{problem.testCases?.length || 0} test cases</span>
                <span>{problem._count.submissions} submissions</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
