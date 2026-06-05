import { ReactNode } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { TaskStatus } from '../types';

interface TaskColumnProps {
  id: TaskStatus;
  label: string;
  count: number;
  borderColor: string;
  children: ReactNode;
}

function TaskColumn({ id, label, count, borderColor, children }: TaskColumnProps) {
  const { isOver, setNodeRef } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      className={`bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 border-t-4 ${borderColor} ${isOver ? 'ring-2 ring-blue-400 bg-blue-50 dark:bg-blue-900/30' : ''} min-h-[150px] transition-colors dark:border-x dark:border-b dark:border-gray-600`}
    >
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-semibold text-sm dark:text-gray-200">{label}</h3>
        <span className="text-xs bg-gray-200 dark:bg-gray-600 px-2 py-0.5 rounded-full dark:text-gray-200">{count}</span>
      </div>
      {children}
    </div>
  );
}

export default TaskColumn;
