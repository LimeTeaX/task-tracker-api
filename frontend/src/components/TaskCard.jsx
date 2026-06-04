const STATUSES = [
  { value: 'todo', label: 'To Do' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'review', label: 'Review' },
  { value: 'done', label: 'Done' },
];

const PRIORITY_STYLES = {
  low: 'bg-green-100 text-green-800',
  medium: 'bg-blue-100 text-blue-800',
  high: 'bg-yellow-100 text-yellow-800',
  critical: 'bg-red-100 text-red-800',
};

const TaskCard = ({ task, onStatusChange, onDelete, onAssign }) => {
  return (
    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h3 className="font-semibold mb-1">{task.title}</h3>
          {task.description && (
            <p className="text-sm text-gray-500 mb-2">{task.description}</p>
          )}
          <div className="flex gap-2 flex-wrap mb-2">
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PRIORITY_STYLES[task.priority] || 'bg-gray-100 text-gray-800'}`}>
              {task.priority}
            </span>
            {task.due_date && (
              <span className="text-xs bg-gray-200 px-2 py-0.5 rounded-full">
                Due: {new Date(task.due_date).toLocaleDateString()}
              </span>
            )}
            {task.assignee && (
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                {task.assignee.name}
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-col gap-2 items-end ml-3">
          <select
            value={task.status}
            onChange={(e) => onStatusChange(task.id, e.target.value)}
            className="text-sm border border-gray-300 rounded-md px-2 py-1 bg-white cursor-pointer"
          >
            {STATUSES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
          <button
            onClick={() => onDelete(task.id)}
            className="text-red-500 text-sm hover:text-red-700"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaskCard;
