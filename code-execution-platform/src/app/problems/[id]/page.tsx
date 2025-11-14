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
  functionName: string;
  parameters: string; // JSON string
  returnType: string;
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
    <div className="min-h-screen bg-[#1a1a1a]">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link
            href="/"
            className="text-sm text-[#b3b3b3] hover:text-[#9333ea] transition-colors"
          >
            ← Back to Problems
          </Link>
        </div>

        <div className="rounded-lg border border-[#3a3a3a] bg-[#262626] p-6">
          <div className="mb-6 flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-semibold text-white">{problem.title}</h1>
              <p className="mt-2 text-sm text-[#888888]">
                Created {new Date(problem.createdAt).toLocaleDateString()}
              </p>
            </div>
            <button
              onClick={handleDelete}
              className="rounded-md bg-[#ff3b3b] px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#ff2b2b]"
            >
              Delete
            </button>
          </div>

          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-medium text-white">Description</h2>
              <p className="mt-2 whitespace-pre-wrap text-[#b3b3b3] leading-relaxed">
                {problem.description}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <h3 className="text-sm font-medium text-[#888888] uppercase tracking-wide">Example Input</h3>
                <pre className="mt-2 rounded-md bg-[#1a1a1a] border border-[#3a3a3a] p-4 text-sm text-[#e5e5e5] font-mono">
                  {problem.exampleInput}
                </pre>
              </div>
              <div>
                <h3 className="text-sm font-medium text-[#888888] uppercase tracking-wide">Example Output</h3>
                <pre className="mt-2 rounded-md bg-[#1a1a1a] border border-[#3a3a3a] p-4 text-sm text-[#e5e5e5] font-mono">
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
              functionName={problem.functionName}
              parameters={JSON.parse(problem.parameters)}
              returnType={problem.returnType}
            />

            <div className="border-t border-[#3a3a3a] pt-6">
              <Link
                href={`/problems/${problem.id}/solve`}
                className="inline-flex items-center rounded-md bg-[#9333ea] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#7c3aed]"
              >
                Solve This Problem
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

