'use client';

import { useState, useEffect, useRef } from 'react';

interface Parameter {
  name: string;
  type: string;
}

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
  functionName: string;
  parameters: Parameter[];
  returnType: string;
}

export default function TestCaseManager({
  problemId,
  testCases,
  onTestCaseAdded,
  onTestCaseDeleted,
  problemDescription,
  exampleInput,
  exampleOutput,
  functionName,
  parameters,
  returnType,
}: TestCaseManagerProps) {
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [showGenerateDialog, setShowGenerateDialog] = useState(false);
  const [testCaseCount, setTestCaseCount] = useState(5);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<{
    parameterValues: Record<string, string>;
    expectedOutput: string;
  }>({
    parameterValues: {},
    expectedOutput: '',
  });

  // Initialize parameter values when form opens or parameters change
  useEffect(() => {
    if (showForm && parameters.length > 0) {
      const initialValues: Record<string, string> = {};
      parameters.forEach(param => {
        if (!formData.parameterValues[param.name]) {
          // Set default based on type
          if (param.type.includes('List')) {
            initialValues[param.name] = '[]';
          } else if (param.type.includes('Dict')) {
            initialValues[param.name] = '{}';
          } else if (param.type === 'bool') {
            initialValues[param.name] = 'false';
          } else if (param.type === 'int') {
            initialValues[param.name] = '0';
          } else {
            initialValues[param.name] = '';
          }
        } else {
          initialValues[param.name] = formData.parameterValues[param.name];
        }
      });
      setFormData(prev => ({ ...prev, parameterValues: initialValues }));
    }
  }, [showForm, parameters]);
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
      // Build input string from parameter values: "param1 = value1, param2 = value2"
      const inputString = parameters
        .map(param => `${param.name} = ${formData.parameterValues[param.name] || ''}`)
        .join(', ');

      const testCaseData = {
        input: inputString,
        expectedOutput: formData.expectedOutput,
      };

      if (editingId) {
        // Update existing test case
        const response = await fetch(`/api/test-cases/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(testCaseData),
        });

        if (!response.ok) throw new Error('Failed to update test case');
      } else {
        // Create new test case
        const response = await fetch('/api/test-cases', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...testCaseData, problemId }),
        });

        if (!response.ok) throw new Error('Failed to create test case');
      }

      setFormData({ parameterValues: {}, expectedOutput: '' });
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
    // Parse the input string back into parameter values
    const paramValues: Record<string, string> = {};
    
    // Parse "param1 = value1, param2 = value2" format
    if (testCase.input.includes('=')) {
      const parts = testCase.input.split(',').map(p => p.trim());
      for (const part of parts) {
        const equalsIndex = part.indexOf('=');
        if (equalsIndex !== -1) {
          const name = part.substring(0, equalsIndex).trim();
          const value = part.substring(equalsIndex + 1).trim();
          paramValues[name] = value;
        }
      }
    }
    
    // Fill in missing parameters with defaults
    parameters.forEach(param => {
      if (!paramValues[param.name]) {
        if (param.type.includes('List')) {
          paramValues[param.name] = '[]';
        } else if (param.type.includes('Dict')) {
          paramValues[param.name] = '{}';
        } else if (param.type === 'bool') {
          paramValues[param.name] = 'false';
        } else if (param.type === 'int') {
          paramValues[param.name] = '0';
        } else {
          paramValues[param.name] = '';
        }
      }
    });

    setFormData({
      parameterValues: paramValues,
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
    setFormData({ parameterValues: {}, expectedOutput: '' });
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
          functionName,
          parameters,
          returnType,
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
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold text-white">
            Test Cases
          </h2>
          <span className="rounded-full bg-[#9333ea] px-2.5 py-0.5 text-xs font-medium text-white">
            {testCases.length}
          </span>
        </div>
        {!showForm && (
          <div className="flex gap-2">
            {problemDescription && exampleInput && exampleOutput && (
              <div className="relative">
                <button
                  onClick={() => setShowGenerateDialog(true)}
                  disabled={generating}
                  className="ai-button rounded-md px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed disabled:animation-none"
                >
                  {generating ? (
                    'Generating...'
                  ) : (
                    <>
                      <span className="sparkle">✨</span> Generate with AI
                    </>
                  )}
                </button>
                {showGenerateDialog && (
                  <div
                    ref={dialogRef}
                    className="absolute right-0 top-12 z-10 w-64 rounded-lg border border-[#3a3a3a] bg-[#262626] p-4 shadow-lg"
                  >
                    <h3 className="mb-3 text-sm font-semibold text-white">
                      Generate Test Cases
                    </h3>
                    <div className="mb-4">
                      <label
                        htmlFor="testCaseCount"
                        className="block text-sm font-medium text-[#b3b3b3]"
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
                        className="mt-1 block w-full rounded-md border border-[#3a3a3a] bg-[#1a1a1a] px-3 py-2 text-sm text-white placeholder:text-[#888888] focus:border-[#9333ea] focus:outline-none focus:ring-1 focus:ring-[#9333ea]"
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setShowGenerateDialog(false)}
                        className="rounded-md border border-[#3a3a3a] bg-[#1a1a1a] px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-[#262626]"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleGenerateWithAI}
                        disabled={generating}
                        className="rounded-md bg-[#9333ea] px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#7c3aed] disabled:opacity-50"
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
              className="rounded-md bg-[#9333ea] px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#7c3aed]"
            >
              Add Test Case
            </button>
          </div>
        )}
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="rounded-md border border-[#3a3a3a] bg-[#262626] p-4"
        >
          <h3 className="mb-4 font-medium text-white">
            {editingId ? 'Edit Test Case' : 'New Test Case'}
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#b3b3b3] mb-2">
                Parameters
              </label>
              <div className="space-y-3">
                {parameters.map((param) => (
                  <div key={param.name}>
                    <label
                      htmlFor={`param-${param.name}`}
                      className="block text-xs font-medium text-[#b3b3b3]"
                    >
                      {param.name} ({param.type})
                    </label>
                    <textarea
                      id={`param-${param.name}`}
                      required
                      rows={2}
                      value={formData.parameterValues[param.name] || ''}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          parameterValues: {
                            ...prev.parameterValues,
                            [param.name]: e.target.value,
                          },
                        }))
                      }
                      className="mt-1 block w-full rounded-md border border-[#3a3a3a] bg-[#1a1a1a] px-3 py-2 font-mono text-sm text-white placeholder:text-[#888888] focus:border-[#9333ea] focus:outline-none focus:ring-1 focus:ring-[#9333ea]"
                      placeholder={
                        param.type.includes('List')
                          ? '[1, 2, 3]'
                          : param.type.includes('Dict')
                          ? '{"key": "value"}'
                          : param.type === 'int'
                          ? '42'
                          : param.type === 'bool'
                          ? 'true'
                          : param.type === 'str'
                          ? '"hello"'
                          : 'value'
                      }
                    />
                  </div>
                ))}
              </div>
            </div>
            <div>
              <label
                htmlFor="expectedOutput"
                className="block text-sm font-medium text-[#b3b3b3]"
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
                className="mt-1 block w-full rounded-md border border-[#3a3a3a] bg-[#1a1a1a] px-3 py-2 font-mono text-sm text-white placeholder:text-[#888888] focus:border-[#9333ea] focus:outline-none focus:ring-1 focus:ring-[#9333ea]"
                placeholder="e.g., [0, 1]"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={handleCancel}
                className="rounded-md border border-[#3a3a3a] bg-[#1a1a1a] px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-[#262626]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="rounded-md bg-[#9333ea] px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#7c3aed] disabled:opacity-50"
              >
                {loading ? 'Saving...' : editingId ? 'Update' : 'Add'}
              </button>
            </div>
          </div>
        </form>
      )}

      {testCases.length === 0 ? (
        <div className="rounded-md border border-dashed border-[#3a3a3a] bg-[#262626] p-8 text-center">
          <p className="text-[#b3b3b3]">
            No test cases yet. Add some to validate solutions.
          </p>
        </div>
      ) : (
        <div className="max-h-[600px] overflow-y-auto space-y-3 pr-2">
          {testCases.map((testCase, index) => (
            <div
              key={testCase.id}
              className="rounded-md border border-[#3a3a3a] bg-[#262626] p-4"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-[#9333ea] px-2.5 py-0.5 text-xs font-medium text-white">
                    {index + 1}
                  </span>
                  <h4 className="font-medium text-white">
                    Test Case
                  </h4>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(testCase)}
                    className="text-sm text-[#9333ea] hover:text-[#7c3aed] transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(testCase.id)}
                    className="text-sm text-[#ff3b3b] hover:text-[#ff2b2b] transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-medium text-[#b3b3b3]">Input:</p>
                  <pre className="mt-1 rounded bg-[#1a1a1a] border border-[#3a3a3a] p-2 text-sm text-white font-mono overflow-x-auto">{testCase.input}</pre>
                </div>
                <div>
                  <p className="text-xs font-medium text-[#b3b3b3]">Expected Output:</p>
                  <pre className="mt-1 rounded bg-[#1a1a1a] border border-[#3a3a3a] p-2 text-sm text-white font-mono overflow-x-auto">
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

