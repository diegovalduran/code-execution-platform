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
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold text-gray-900">Review Submission</h2>
      
      <div className="space-y-4">
        <div>
          <label
            htmlFor="reviewerNotes"
            className="block text-sm font-medium text-gray-700"
          >
            Reviewer Notes (Optional)
          </label>
          <textarea
            id="reviewerNotes"
            rows={4}
            value={reviewerNotes}
            onChange={(e) => onNotesChange(e.target.value)}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
            placeholder="Add any feedback or notes for the submitter..."
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={onApprove}
            disabled={processing || !isPending}
            className="flex-1 rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-500 disabled:opacity-50"
          >
            {processing ? 'Processing...' : 'Approve'}
          </button>
          <button
            onClick={onReject}
            disabled={processing || !isPending}
            className="flex-1 rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 disabled:opacity-50"
          >
            {processing ? 'Processing...' : 'Reject'}
          </button>
        </div>

        {!isPending && (
          <p className="text-xs text-gray-500">
            This submission has already been reviewed.
          </p>
        )}
      </div>
    </div>
  );
}

