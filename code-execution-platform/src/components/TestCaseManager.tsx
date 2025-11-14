'use client';

import { useState, useEffect, useRef } from 'react';

interface TestCase {
  id: string;
  input: string;
  expectedOutput: string;
}

interface TestCaseManagerProps {
  problemId: string;
  testCases: TestCase[];
  onTestCaseAdded: () => void;
  onTestCaseDeleted: () => void;
  problemDescription?: string;
  exampleInput?: string;
  exampleOutput?: string;
}

export default function TestCaseManager({
  problemId,
  testCases,
  onTestCaseAdded,
  onTestCaseDeleted,
  problemDescription,
  exampleInput,
  exampleOutput,
}: TestCaseManagerProps) {
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [showGenerateDialog, setShowGenerateDialog] = useState(false);
  const [testCaseCount, setTestCaseCount] = useState(5);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    input: '',
    expectedOutput: '',
  });
  const dialogRef = useRef<HTMLDivElement>(null);

  // Close dialog when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dialogRef.current && !dialogRef.current.contains(event.target as Node)) {
        setShowGenerateDialog(false);
      }
    };

    if (showGenerateDialog) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showGenerateDialog]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingId) {
        // Update existing test case
        const response = await fetch(`/api/test-cases/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });

        if (!response.ok) throw new Error('Failed to update test case');
      } else {
        // Create new test case
        const response = await fetch('/api/test-cases', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...formData, problemId }),
        });

        if (!response.ok) throw new Error('Failed to create test case');
      }

      setFormData({ input: '', expectedOutput: '' });
      setShowForm(false);
      setEditingId(null);
      onTestCaseAdded();
    } catch (error) {
      console.error('Error saving test case:', error);
      alert('Failed to save test case');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (testCase: TestCase) => {
    setFormData({
      input: testCase.input,
      expectedOutput: testCase.expectedOutput,
    });
    setEditingId(testCase.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this test case?')) return;

    try {
      const response = await fetch(`/api/test-cases/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete test case');
      onTestCaseDeleted();
    } catch (error) {
      console.error('Error deleting test case:', error);
      alert('Failed to delete test case');
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({ input: '', expectedOutput: '' });
  };

  const handleGenerateWithAI = async () => {
    if (!problemDescription || !exampleInput || !exampleOutput) {
      alert('Problem details are required to generate test cases');
      return;
    }

    // Validate count
    const count = Math.min(Math.max(1, testCaseCount), 10);
    setTestCaseCount(count);

    setGenerating(true);
    setShowGenerateDialog(false);
    try {
      // Call the generate API
      const response = await fetch('/api/test-cases/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          problemId,
          problemDescription,
          exampleInput,
          exampleOutput,
          count,
          existingTestCases: testCases.map((tc) => ({
            input: tc.input,
            expectedOutput: tc.expectedOutput,
          })),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate test cases');
      }

      const data = await response.json();
      const generatedTestCases = data.testCases;

      // Batch create all generated test cases
      let successCount = 0;
      let errorCount = 0;

      for (const testCase of generatedTestCases) {
        try {
          const createResponse = await fetch('/api/test-cases', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              problemId,
              input: testCase.input,
              expectedOutput: testCase.expectedOutput,
            }),
          });

          if (createResponse.ok) {
            successCount++;
          } else {
            errorCount++;
          }
        } catch (err) {
          errorCount++;
          console.error('Error creating test case:', err);
        }
      }

      // Refresh test cases
      onTestCaseAdded();

      if (successCount > 0) {
        alert(`Successfully generated ${successCount} test case(s)${errorCount > 0 ? ` (${errorCount} failed)` : ''}`);
      } else {
        alert('Failed to create generated test cases');
      }
    } catch (error) {
      console.error('Error generating test cases:', error);
      alert(error instanceof Error ? error.message : 'Failed to generate test cases');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">
          Test Cases ({testCases.length})
        </h2>
        {!showForm && (
          <div className="flex gap-2">
            {problemDescription && exampleInput && exampleOutput && (
              <div className="relative">
                <button
                  onClick={() => setShowGenerateDialog(true)}
                  disabled={generating}
                  className="rounded-md bg-purple-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-purple-500 disabled:opacity-50"
                >
                  {generating ? 'Generating...' : '✨ Generate with AI'}
                </button>
                {showGenerateDialog && (
                  <div
                    ref={dialogRef}
                    className="absolute right-0 top-12 z-10 w-64 rounded-lg border border-gray-200 bg-white p-4 shadow-lg"
                  >
                    <h3 className="mb-3 text-sm font-semibold text-gray-900">
                      Generate Test Cases
                    </h3>
                    <div className="mb-4">
                      <label
                        htmlFor="testCaseCount"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Number of test cases (max 10)
                      </label>
                      <input
                        id="testCaseCount"
                        type="number"
                        min="1"
                        max="10"
                        value={testCaseCount}
                        onChange={(e) => {
                          const value = parseInt(e.target.value) || 1;
                          setTestCaseCount(Math.min(Math.max(1, value), 10));
                        }}
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setShowGenerateDialog(false)}
                        className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleGenerateWithAI}
                        disabled={generating}
                        className="rounded-md bg-purple-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-purple-500 disabled:opacity-50"
                      >
                        Generate
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
            <button
              onClick={() => setShowForm(true)}
              className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
            >
              Add Test Case
            </button>
          </div>
        )}
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="rounded-md border border-gray-200 bg-gray-50 p-4"
        >
          <h3 className="mb-4 font-medium text-gray-900">
            {editingId ? 'Edit Test Case' : 'New Test Case'}
          </h3>
          <div className="space-y-4">
            <div>
              <label
                htmlFor="input"
                className="block text-sm font-medium text-gray-700"
              >
                Input
              </label>
              <textarea
                id="input"
                required
                rows={3}
                value={formData.input}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, input: e.target.value }))
                }
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 font-mono text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                placeholder="e.g., [2, 7, 11, 15], 9"
              />
            </div>
            <div>
              <label
                htmlFor="expectedOutput"
                className="block text-sm font-medium text-gray-700"
              >
                Expected Output
              </label>
              <textarea
                id="expectedOutput"
                required
                rows={3}
                value={formData.expectedOutput}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    expectedOutput: e.target.value,
                  }))
                }
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 font-mono text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
                placeholder="e.g., [0, 1]"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={handleCancel}
                className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50"
              >
                {loading ? 'Saving...' : editingId ? 'Update' : 'Add'}
              </button>
            </div>
          </div>
        </form>
      )}

      {testCases.length === 0 ? (
        <div className="rounded-md border border-dashed border-gray-300 p-8 text-center">
          <p className="text-gray-600">
            No test cases yet. Add some to validate solutions.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {testCases.map((testCase, index) => (
            <div
              key={testCase.id}
              className="rounded-md border border-gray-200 bg-white p-4"
            >
              <div className="flex items-start justify-between">
                <h4 className="font-medium text-gray-900">
                  Test Case {index + 1}
                </h4>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(testCase)}
                    className="text-sm text-indigo-600 hover:text-indigo-500"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(testCase.id)}
                    className="text-sm text-red-600 hover:text-red-500"
                  >
                    Delete
                  </button>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-medium text-gray-600">Input:</p>
                  <pre className="mt-1 text-sm text-gray-900">{testCase.input}</pre>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-600">Expected Output:</p>
                  <pre className="mt-1 text-sm text-gray-900">
                    {testCase.expectedOutput}
                  </pre>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

