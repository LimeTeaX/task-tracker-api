import { useState, useEffect } from 'react';
import Modal from './Modal';
import { TaskFormData, TaskPriority, Member } from '../types';

interface TaskFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: TaskFormData) => Promise<void>;
  initialData?: TaskFormData;
  members: Member[];
  isEditing: boolean;
}

const defaultForm: TaskFormData = {
  title: '',
  description: '',
  priority: 'medium' as TaskPriority,
  due_date: '',
  assigneeId: '',
};

function TaskForm({ isOpen, onClose, onSubmit, initialData, members, isEditing }: TaskFormProps) {
  const [form, setForm] = useState<TaskFormData>(defaultForm);

  useEffect(() => {
    if (isOpen) {
      setForm(initialData || defaultForm);
    }
  }, [isOpen, initialData]);

  const handleSubmit = async () => {
    if (!form.title.trim()) return;
    await onSubmit(form);
    setForm(defaultForm);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEditing ? 'Edit Task' : 'Create New Task'}>
      <input
        type="text" placeholder="Task Title *"
        value={form.title}
        onChange={(e) => setForm({ ...form, title: e.target.value })}
        className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 mb-3 bg-white dark:bg-gray-700 dark:text-gray-200"
      />
      <textarea
        placeholder="Description"
        value={form.description}
        onChange={(e) => setForm({ ...form, description: e.target.value })}
        className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 mb-3 min-h-[80px] bg-white dark:bg-gray-700 dark:text-gray-200"
      />
      <select
        value={form.priority}
        onChange={(e) => setForm({ ...form, priority: e.target.value as TaskPriority })}
        className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 mb-3 bg-white dark:bg-gray-700 dark:text-gray-200"
      >
        <option value="low">Low</option>
        <option value="medium">Medium</option>
        <option value="high">High</option>
        <option value="critical">Critical</option>
      </select>
      <input
        type="date"
        value={form.due_date}
        onChange={(e) => setForm({ ...form, due_date: e.target.value })}
        className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 mb-3 bg-white dark:bg-gray-700 dark:text-gray-200"
      />
      {!isEditing && (
        <select
          value={form.assigneeId}
          onChange={(e) => setForm({ ...form, assigneeId: e.target.value })}
          className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 mb-4 bg-white dark:bg-gray-700 dark:text-gray-200"
        >
          <option value="">Unassigned</option>
          {members.map(m => (
            <option key={m.id} value={m.id}>{m.name}</option>
          ))}
        </select>
      )}
      <div className="flex justify-end gap-2">
        <button onClick={onClose} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500">Cancel</button>
        <button onClick={handleSubmit} className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600">{isEditing ? 'Save' : 'Create Task'}</button>
      </div>
    </Modal>
  );
}

export default TaskForm;
