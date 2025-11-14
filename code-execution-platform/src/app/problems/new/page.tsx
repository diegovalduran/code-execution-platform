'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Parameter {
  name: string;
  type: string;
}

const PARAMETER_TYPES = [
  'int',
  'str',
  'bool',
  'List[int]',
  'List[str]',
  'List[List[int]]',
  'Dict[str, int]',
  'Dict[str, str]',
  'Optional[int]',
  'Optional[str]',
  'Optional[List[int]]',
];

export default function NewProblem() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    exampleInput: '',
    exampleOutput: '',
    functionName: 'solution',
    returnType: 'None',
  });
  const [parameters, setParameters] = useState<Parameter[]>([
    { name: '', type: 'int' },
  ]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validate parameters
    const validParameters = parameters.filter(p => p.name.trim() !== '');
    if (validParameters.length === 0) {
      setError('At least one parameter is required');
      setLoading(false);
      return;
    }

    // Check for duplicate parameter names
    const paramNames = validParameters.map(p => p.name.trim());
    if (new Set(paramNames).size !== paramNames.length) {
      setError('Parameter names must be unique');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/problems', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          parameters: JSON.stringify(validParameters),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create problem');
      }

      const problem = await response.json();
      router.push(`/problems/${problem.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create problem. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const addParameter = () => {
    setParameters([...parameters, { name: '', type: 'int' }]);
  };

  const removeParameter = (index: number) => {
    setParameters(parameters.filter((_, i) => i !== index));
  };

  const updateParameter = (index: number, field: 'name' | 'type', value: string) => {
    const updated = [...parameters];
    updated[index] = { ...updated[index], [field]: value };
    setParameters(updated);
  };

  // Generate function signature preview
  const getSignaturePreview = () => {
    const validParams = parameters.filter(p => p.name.trim() !== '');
    const paramStr = validParams.map(p => `${p.name}: ${p.type}`).join(', ');
    return `def ${formData.functionName}(${paramStr}) -> ${formData.returnType}:`;
  };

  return (
    <div className="min-h-screen bg-[#1a1a1a]">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link
            href="/"
            className="text-sm text-[#b3b3b3] hover:text-[#9333ea] transition-colors"
          >
            ← Back to Problems
          </Link>
          <h1 className="mt-4 text-3xl font-bold text-white">
            Create New Problem
          </h1>
          <p className="mt-2 text-[#b3b3b3]">
            Define a new coding challenge for others to solve
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-md border border-[#ff3b3b]/30 bg-[#ff3b3b]/10 p-4">
            <p className="text-sm text-[#ff3b3b]">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="rounded-lg border border-[#3a3a3a] bg-[#262626] p-6">
          <div className="space-y-6">
            <div>
              <label
                htmlFor="title"
                className="block text-sm font-medium text-[#b3b3b3]"
              >
                Title
              </label>
              <input
                type="text"
                name="title"
                id="title"
                required
                value={formData.title}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border border-[#3a3a3a] bg-[#1a1a1a] px-3 py-2 text-white placeholder:text-[#888888] focus:border-[#9333ea] focus:outline-none focus:ring-1 focus:ring-[#9333ea]"
                placeholder="e.g., Two Sum"
              />
            </div>

            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-[#b3b3b3]"
              >
                Description
              </label>
              <textarea
                name="description"
                id="description"
                required
                rows={6}
                value={formData.description}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border border-[#3a3a3a] bg-[#1a1a1a] px-3 py-2 text-white placeholder:text-[#888888] focus:border-[#9333ea] focus:outline-none focus:ring-1 focus:ring-[#9333ea]"
                placeholder="Describe the problem in detail..."
              />
            </div>

            <div className="space-y-4 rounded-md border border-[#3a3a3a] bg-[#1a1a1a] p-4">
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Function Definition
                </label>
                
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="functionName"
                      className="block text-xs font-medium text-[#b3b3b3]"
                    >
                      Function Name
                    </label>
                    <input
                      type="text"
                      name="functionName"
                      id="functionName"
                      required
                      value={formData.functionName}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border border-[#3a3a3a] bg-[#262626] px-3 py-2 font-mono text-sm text-white placeholder:text-[#888888] focus:border-[#9333ea] focus:outline-none focus:ring-1 focus:ring-[#9333ea]"
                      placeholder="twoSum"
                    />
                  </div>
                  
                  <div>
                    <label
                      htmlFor="returnType"
                      className="block text-xs font-medium text-[#b3b3b3]"
                    >
                      Return Type
                    </label>
                    <select
                      name="returnType"
                      id="returnType"
                      required
                      value={formData.returnType}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border border-[#3a3a3a] bg-[#1a1a1a] px-3 py-2 text-sm text-white focus:border-[#9333ea] focus:outline-none focus:ring-1 focus:ring-[#9333ea]"
                    >
                      <option value="None" className="bg-[#1a1a1a]">None</option>
                      <option value="int" className="bg-[#1a1a1a]">int</option>
                      <option value="str" className="bg-[#1a1a1a]">str</option>
                      <option value="bool" className="bg-[#1a1a1a]">bool</option>
                      <option value="List[int]" className="bg-[#1a1a1a]">List[int]</option>
                      <option value="List[str]" className="bg-[#1a1a1a]">List[str]</option>
                      <option value="List[List[int]]" className="bg-[#1a1a1a]">List[List[int]]</option>
                      <option value="Dict[str, int]" className="bg-[#1a1a1a]">Dict[str, int]</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-medium text-[#b3b3b3]">
                    Parameters
                  </label>
                  <button
                    type="button"
                    onClick={addParameter}
                    className="text-xs text-[#9333ea] hover:text-[#7c3aed] transition-colors"
                  >
                    + Add Parameter
                  </button>
                </div>
                
                <div className="space-y-2">
                  {parameters.map((param, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Parameter name"
                        value={param.name}
                        onChange={(e) => updateParameter(index, 'name', e.target.value)}
                        className="flex-1 rounded-md border border-[#3a3a3a] bg-[#262626] px-3 py-2 font-mono text-sm text-white placeholder:text-[#888888] focus:border-[#9333ea] focus:outline-none focus:ring-1 focus:ring-[#9333ea]"
                      />
                      <select
                        value={param.type}
                        onChange={(e) => updateParameter(index, 'type', e.target.value)}
                        className="w-40 rounded-md border border-[#3a3a3a] bg-[#1a1a1a] px-3 py-2 text-sm text-white focus:border-[#9333ea] focus:outline-none focus:ring-1 focus:ring-[#9333ea]"
                      >
                        {PARAMETER_TYPES.map((type) => (
                          <option key={type} value={type} className="bg-[#1a1a1a]">
                            {type}
                          </option>
                        ))}
                      </select>
                      {parameters.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeParameter(index)}
                          className="px-2 text-[#ff3b3b] hover:text-[#ff2b2b] transition-colors"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-md bg-[#262626] p-3 border border-[#3a3a3a]">
                <p className="text-xs font-medium text-[#b3b3b3] mb-1">Preview:</p>
                <code className="text-sm text-[#e5e5e5]">{getSignaturePreview()}</code>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="exampleInput"
                  className="block text-sm font-medium text-[#b3b3b3]"
                >
                  Example Input
                </label>
                <textarea
                  name="exampleInput"
                  id="exampleInput"
                  required
                  rows={4}
                  value={formData.exampleInput}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border border-[#3a3a3a] bg-[#1a1a1a] px-3 py-2 font-mono text-sm text-white placeholder:text-[#888888] focus:border-[#9333ea] focus:outline-none focus:ring-1 focus:ring-[#9333ea]"
                  placeholder="[2, 7, 11, 15], 9"
                />
              </div>

              <div>
                <label
                  htmlFor="exampleOutput"
                  className="block text-sm font-medium text-[#b3b3b3]"
                >
                  Example Output
                </label>
                <textarea
                  name="exampleOutput"
                  id="exampleOutput"
                  required
                  rows={4}
                  value={formData.exampleOutput}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border border-[#3a3a3a] bg-[#1a1a1a] px-3 py-2 font-mono text-sm text-white placeholder:text-[#888888] focus:border-[#9333ea] focus:outline-none focus:ring-1 focus:ring-[#9333ea]"
                  placeholder="[0, 1]"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Link
            href="/"
            className="rounded-md border border-[#3a3a3a] bg-[#262626] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#2d2d2d]"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="rounded-md bg-[#9333ea] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#7c3aed] disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Create Problem'}
          </button>
        </div>
      </form>
      </div>
    </div>
  );
}

