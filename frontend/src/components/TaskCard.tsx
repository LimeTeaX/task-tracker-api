import { Task } from '../types';

interface TaskCardProps {
  task: Task;
  onDelete: (taskId: string) => void;
  onEdit?: (task: Task) => void;
}

const PRIORITY_STYLES: Record<string, string> = {
  low: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  medium: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  high: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  critical: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
};

const STATUS_STYLES: Record<string, string> = {
  todo: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
  in_progress: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  review: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  done: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
};

const TaskCard = ({ task, onDelete, onEdit }: TaskCardProps) => {
  return (
    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border border-gray-200 dark:border-gray-600 hover:shadow-sm transition-shadow">
      <div className="flex justify-between items-start">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold mb-1 truncate text-gray-900 dark:text-gray-100">{task.title}</h3>
          {task.description && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-2 line-clamp-2">{task.description}</p>
          )}
          <div className="flex gap-2 flex-wrap mb-2">
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PRIORITY_STYLES[task.priority] || 'bg-gray-100 text-gray-800'}`}>
              {task.priority}
            </span>
            {task.due_date && (
              <span className="text-xs bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 px-2 py-0.5 rounded-full">
                Due: {new Date(task.due_date).toLocaleDateString()}
              </span>
            )}
            {task.assignee && (
              <span className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 px-2 py-0.5 rounded-full">
                {task.assignee.name}
              </span>
            )}
            <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_STYLES[task.status] || 'bg-gray-100 text-gray-800'}`}>
              {task.status === 'todo' ? 'To Do' :
               task.status === 'in_progress' ? 'In Progress' :
               task.status === 'review' ? 'Review' :
               task.status === 'done' ? 'Done' : task.status}
            </span>
          </div>
        </div>
        <div className="flex flex-col gap-2 items-end ml-3 shrink-0">
          {onEdit && (
            <button
              onClick={() => onEdit(task)}
              className="text-yellow-600 dark:text-yellow-400 text-sm hover:underline"
            >
              Edit
            </button>
          )}
          <button
            onClick={() => onDelete(task.id)}
            className="text-red-500 dark:text-red-400 text-sm hover:underline"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaskCard;
