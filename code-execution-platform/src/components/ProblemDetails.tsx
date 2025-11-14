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
    <div className="mb-6 rounded-lg border border-[#3a3a3a] bg-[#262626] p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h1 className="text-2xl font-semibold text-white">{title}</h1>

          {/* Problem Description */}
          <div className="mt-6 space-y-4">
            <div>
              <h2 className="text-sm font-medium text-white">Description</h2>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-[#b3b3b3]">
                {description}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <h3 className="text-xs font-medium text-[#888888] uppercase tracking-wide">Example Input</h3>
                <pre className="mt-2 rounded-md bg-[#1a1a1a] border border-[#3a3a3a] p-3 text-xs text-[#e5e5e5] font-mono">
                  {exampleInput}
                </pre>
              </div>
              <div>
                <h3 className="text-xs font-medium text-[#888888] uppercase tracking-wide">Example Output</h3>
                <pre className="mt-2 rounded-md bg-[#1a1a1a] border border-[#3a3a3a] p-3 text-xs text-[#e5e5e5] font-mono">
                  {exampleOutput}
                </pre>
              </div>
            </div>
          </div>
        </div>
        <Link
          href={`/problems/${problemId}`}
          className="ml-4 text-sm text-[#9333ea] hover:text-[#7c3aed] transition-colors"
        >
          View Problem →
        </Link>
      </div>
    </div>
  );
}

