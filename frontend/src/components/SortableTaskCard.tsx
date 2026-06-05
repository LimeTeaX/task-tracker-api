import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Task } from '../types';

interface SortableTaskCardProps {
  task: Task;
  onDelete: (taskId: string) => void;
  onEdit: (task: Task) => void;
  onOpenComments: (taskId: string) => void;
  commentCount: number;
}

function SortableTaskCard({ task, onDelete, onEdit, onOpenComments, commentCount }: SortableTaskCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { status: task.status },
  });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} className={`${isDragging ? 'opacity-50' : ''}`}>
      <div className="bg-white dark:bg-gray-700 rounded-md p-3 border border-gray-200 dark:border-gray-600 shadow-sm hover:shadow cursor-grab active:cursor-grabbing">
        <div className="flex justify-between items-start mb-1">
          <p className="font-medium text-sm truncate flex-1 dark:text-gray-100">{task.title}</p>
          <span className={`text-xs px-1.5 py-0.5 rounded ml-1 ${
            task.priority === 'critical' ? 'bg-red-100 text-red-700' :
            task.priority === 'high' ? 'bg-yellow-100 text-yellow-700' :
            task.priority === 'medium' ? 'bg-blue-100 text-blue-700' :
            'bg-green-100 text-green-700'
          }`}>
            {task.priority}
          </span>
        </div>
        {task.assignee && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{task.assignee.name}</p>
        )}
        <div className="flex items-center gap-2 mt-2">
          <button onClick={(e) => { e.stopPropagation(); onEdit(task); }} className="text-xs text-yellow-600 hover:text-yellow-800">Edit</button>
          <button onClick={(e) => { e.stopPropagation(); onOpenComments(task.id); }} className="text-xs text-blue-600 hover:text-blue-800">
            {commentCount ? `${commentCount} comments` : 'Comment'}
          </button>
          <button onClick={(e) => { e.stopPropagation(); onDelete(task.id); }} className="text-xs text-red-500 hover:text-red-700 ml-auto">Delete</button>
        </div>
      </div>
    </div>
  );
}

export default SortableTaskCard;
