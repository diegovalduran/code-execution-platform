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
      return 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50';
    }
    switch (filter.color) {
      case 'indigo':
        return 'bg-indigo-600 text-white';
      case 'yellow':
        return 'bg-yellow-600 text-white';
      case 'green':
        return 'bg-green-600 text-white';
      case 'red':
        return 'bg-red-600 text-white';
      default:
        return 'bg-gray-600 text-white';
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

