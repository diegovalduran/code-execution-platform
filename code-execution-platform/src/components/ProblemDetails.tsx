import Link from 'next/link';

interface ProblemDetailsProps {
  title: string;
  description: string;
  exampleInput: string;
  exampleOutput: string;
  problemId: string;
}

export default function ProblemDetails({
  title,
  description,
  exampleInput,
  exampleOutput,
  problemId,
}: ProblemDetailsProps) {
  return (
    <div className="mb-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>

          {/* Problem Description */}
          <div className="mt-6 space-y-4">
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Description</h2>
              <p className="mt-2 whitespace-pre-wrap text-sm text-gray-700">
                {description}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <h3 className="text-xs font-semibold text-gray-900">Example Input</h3>
                <pre className="mt-1 rounded-md bg-gray-50 p-2 text-xs">
                  {exampleInput}
                </pre>
              </div>
              <div>
                <h3 className="text-xs font-semibold text-gray-900">Example Output</h3>
                <pre className="mt-1 rounded-md bg-gray-50 p-2 text-xs">
                  {exampleOutput}
                </pre>
              </div>
            </div>
          </div>
        </div>
        <Link
          href={`/problems/${problemId}`}
          className="ml-4 text-sm text-indigo-600 hover:text-indigo-500"
        >
          View Problem →
        </Link>
      </div>
    </div>
  );
}

