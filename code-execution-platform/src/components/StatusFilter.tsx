interface StatusFilterProps {
  currentFilter: string;
  onFilterChange: (filter: string) => void;
  showCounts?: boolean;
  counts?: {
    pending?: number;
    approved?: number;
    rejected?: number;
  };
}

export default function StatusFilter({
  currentFilter,
  onFilterChange,
  showCounts = false,
  counts,
}: StatusFilterProps) {
  const filters = [
    { value: 'all', label: 'All', color: 'indigo' },
    { value: 'pending', label: 'Pending', color: 'yellow' },
    { value: 'approved', label: 'Approved', color: 'green' },
    { value: 'rejected', label: 'Rejected', color: 'red' },
  ];

  const getLabel = (filter: { value: string; label: string }) => {
    if (showCounts && counts) {
      if (filter.value === 'pending' && counts.pending !== undefined) {
        return `${filter.label} (${counts.pending})`;
      }
      if (filter.value === 'approved' && counts.approved !== undefined) {
        return `${filter.label} (${counts.approved})`;
      }
      if (filter.value === 'rejected' && counts.rejected !== undefined) {
        return `${filter.label} (${counts.rejected})`;
      }
    }
    return filter.label;
  };

  const getColorClass = (filter: { value: string; color: string }, isActive: boolean) => {
    if (!isActive) {
      return 'bg-[#262626] text-[#b3b3b3] border border-[#3a3a3a] hover:bg-[#2d2d2d] hover:text-white transition-colors';
    }
    switch (filter.color) {
      case 'indigo':
        return 'bg-[#9333ea] text-white border border-[#9333ea]';
      case 'yellow':
        return 'bg-[#9333ea] text-white border border-[#9333ea]';
      case 'green':
        return 'bg-[#00b8a3] text-white border border-[#00b8a3]';
      case 'red':
        return 'bg-[#ff3b3b] text-white border border-[#ff3b3b]';
      default:
        return 'bg-[#3a3a3a] text-white border border-[#3a3a3a]';
    }
  };

  return (
    <div className="flex gap-2">
      {filters.map((filter) => {
        const isActive = currentFilter === filter.value;
        return (
          <button
            key={filter.value}
            onClick={() => onFilterChange(filter.value)}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${getColorClass(filter, isActive)}`}
          >
            {getLabel(filter)}
          </button>
        );
      })}
    </div>
  );
}

