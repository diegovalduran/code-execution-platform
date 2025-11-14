interface ReviewPanelProps {
  status: string;
  reviewerNotes: string;
  onNotesChange: (notes: string) => void;
  onApprove: () => void;
  onReject: () => void;
  processing: boolean;
}

export default function ReviewPanel({
  status,
  reviewerNotes,
  onNotesChange,
  onApprove,
  onReject,
  processing,
}: ReviewPanelProps) {
  const isPending = status === 'pending';

  return (
    <div className="rounded-lg border border-[#3a3a3a] bg-[#262626] p-4">
      <h2 className="mb-4 text-lg font-semibold text-white">Review Submission</h2>
      
      <div className="space-y-4">
        <div>
          <label
            htmlFor="reviewerNotes"
            className="block text-sm font-medium text-[#b3b3b3]"
          >
            Reviewer Notes (Optional)
          </label>
          <textarea
            id="reviewerNotes"
            rows={4}
            value={reviewerNotes}
            onChange={(e) => onNotesChange(e.target.value)}
            className="mt-1 block w-full rounded-md border border-[#3a3a3a] bg-[#1a1a1a] px-3 py-2 text-sm text-white placeholder:text-[#888888] focus:border-[#9333ea] focus:outline-none focus:ring-1 focus:ring-[#9333ea]"
            placeholder="Add any feedback or notes for the submitter..."
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={onApprove}
            disabled={processing || !isPending}
            className="flex-1 rounded-md bg-[#00b8a3] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#00a693] disabled:opacity-50"
          >
            {processing ? 'Processing...' : 'Approve'}
          </button>
          <button
            onClick={onReject}
            disabled={processing || !isPending}
            className="flex-1 rounded-md bg-[#ff3b3b] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#ff2b2b] disabled:opacity-50"
          >
            {processing ? 'Processing...' : 'Reject'}
          </button>
        </div>

        {!isPending && (
          <p className="text-xs text-[#888888]">
            This submission has already been reviewed.
          </p>
        )}
      </div>
    </div>
  );
}

