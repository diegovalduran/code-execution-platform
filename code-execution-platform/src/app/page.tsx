'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
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
  const router = useRouter();
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

  const handleDelete = async (e: React.MouseEvent, problemId: string) => {
    e.stopPropagation(); // Prevent row click
    
    if (!confirm('Are you sure you want to delete this problem? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/problems/${problemId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) throw new Error('Failed to delete problem');
      
      // Refresh the problems list
      fetchProblems();
    } catch (err) {
      alert('Failed to delete problem');
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#1a1a1a]">
        <div className="text-lg text-[#b3b3b3]">Loading problems...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#1a1a1a]">
        <div className="text-lg text-[#ff3b3b]">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1a1a1a]">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-white">Problems</h1>
        </div>

        {problems.length === 0 ? (
          <div className="rounded-lg border border-dashed border-[#3a3a3a] bg-[#262626] p-12 text-center">
            <h3 className="text-lg font-medium text-white">No problems yet</h3>
            <p className="mt-2 text-[#b3b3b3]">
              Get started by creating your first coding problem
            </p>
            <Link
              href="/problems/new"
              className="mt-4 inline-flex items-center rounded-md bg-[#9333ea] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#7c3aed]"
            >
              Create Problem
            </Link>
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-[#3a3a3a] bg-[#262626]">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#3a3a3a]">
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-[#888888]">
                      Title
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-[#888888]">
                      Test Cases
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-[#888888]">
                      Submissions
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-[#888888]">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#3a3a3a]">
                  {problems.map((problem) => (
                    <tr
                      key={problem.id}
                      className="transition-colors hover:bg-[#2d2d2d] cursor-pointer"
                      onClick={() => router.push(`/problems/${problem.id}`)}
                    >
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-white hover:text-[#9333ea] transition-colors">
                          {problem.title}
                        </div>
                        <p className="mt-1 line-clamp-1 text-xs text-[#b3b3b3]">
                          {problem.description}
                        </p>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-[#b3b3b3]">
                        {problem.testCases?.length || 0}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-[#b3b3b3]">
                        {problem._count.submissions}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm">
                        <button
                          onClick={(e) => handleDelete(e, problem.id)}
                          className="rounded-md bg-[#ff3b3b] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[#ff2b2b]"
                          title="Delete problem"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
