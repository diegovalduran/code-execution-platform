interface StatusBadgeProps {
  status: string;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'approved':
      return 'bg-[#00b8a3]/20 text-[#00b8a3] border border-[#00b8a3]/30';
    case 'rejected':
      return 'bg-[#ff3b3b]/20 text-[#ff3b3b] border border-[#ff3b3b]/30';
    case 'pending':
      return 'bg-[#9333ea]/20 text-[#9333ea] border border-[#9333ea]/30';
    default:
      return 'bg-[#3a3a3a] text-[#b3b3b3] border border-[#3a3a3a]';
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'approved':
      return 'Approved';
    case 'rejected':
      return 'Rejected';
    case 'pending':
      return 'Pending Review';
    default:
      return status;
  }
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span
      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(status)}`}
    >
      {getStatusLabel(status)}
    </span>
  );
}

