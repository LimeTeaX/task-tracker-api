interface SkeletonListProps {
  count?: number;
}

interface SkeletonTaskListProps {
  count?: number;
}

const SkeletonCard = () => (
  <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm animate-pulse">
    <div className="flex justify-between mb-3">
      <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/5" />
      <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-16" />
    </div>
    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-1" />
    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-4/5 mb-4" />
    <div className="flex justify-between">
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24" />
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16" />
    </div>
  </div>
);

const SkeletonList = ({ count = 6 }: SkeletonListProps) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
    {Array.from({ length: count }).map((_, i) => (
      <SkeletonCard key={i} />
    ))}
  </div>
);

const SkeletonTask = () => (
  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600 animate-pulse">
    <div className="flex justify-between">
      <div className="flex-1">
        <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-3/5 mb-2" />
        <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-full mb-2" />
        <div className="flex gap-2">
          <div className="h-5 bg-gray-200 dark:bg-gray-600 rounded w-16" />
          <div className="h-5 bg-gray-200 dark:bg-gray-600 rounded w-24" />
        </div>
      </div>
      <div className="h-8 bg-gray-200 dark:bg-gray-600 rounded w-28 ml-3" />
    </div>
  </div>
);

const SkeletonTaskList = ({ count = 4 }: SkeletonTaskListProps) => (
  <div className="flex flex-col gap-3">
    {Array.from({ length: count }).map((_, i) => (
      <SkeletonTask key={i} />
    ))}
  </div>
);

const SkeletonDetail = () => (
  <div className="animate-pulse space-y-6">
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
      <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-2/5 mb-2" />
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-4/5" />
    </div>
    <div className="flex gap-1 bg-white dark:bg-gray-800 rounded-lg p-1 shadow-sm">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="flex-1 h-9 bg-gray-200 dark:bg-gray-700 rounded-md" />
      ))}
    </div>
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
      <SkeletonTaskList count={3} />
    </div>
  </div>
);

export { SkeletonCard, SkeletonList, SkeletonTask, SkeletonTaskList, SkeletonDetail };
