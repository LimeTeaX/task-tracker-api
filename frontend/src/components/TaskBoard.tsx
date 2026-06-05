import { useState } from 'react';
import {
  DndContext, DragOverlay, closestCenter, useSensor, useSensors,
  PointerSensor, DragEndEvent, DragStartEvent,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import TaskColumn from './TaskColumn';
import SortableTaskCard from './SortableTaskCard';
import { Task, TaskStatus, Comment } from '../types';

const STATUSES: TaskStatus[] = ['todo', 'in_progress', 'review', 'done'];

const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: 'To Do',
  in_progress: 'In Progress',
  review: 'Review',
  done: 'Done',
};

const STATUS_COLORS: Record<TaskStatus, string> = {
  todo: 'border-gray-300',
  in_progress: 'border-blue-300',
  review: 'border-yellow-300',
  done: 'border-green-300',
};

interface TaskBoardProps {
  tasks: Task[];
  onStatusChange: (taskId: string, status: TaskStatus) => void;
  onDelete: (taskId: string) => void;
  onEdit: (task: Task) => void;
  onOpenComments: (taskId: string) => void;
  comments: Record<string, Comment[]>;
}

function TaskBoard({ tasks, onStatusChange, onDelete, onEdit, onOpenComments, comments }: TaskBoardProps) {
  const [activeDragTask, setActiveDragTask] = useState<Task | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const handleDragStart = (event: DragStartEvent) => {
    setActiveDragTask(tasks.find(t => t.id === event.active.id) || null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const taskId = active.id as string;
    const newStatus = over.id as TaskStatus;

    if (newStatus === active.data.current?.status) return;
    if (!STATUSES.includes(newStatus)) return;

    onStatusChange(taskId, newStatus);
    setActiveDragTask(null);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {STATUSES.map(status => {
          const columnTasks = tasks.filter(t => t.status === status);
          return (
            <TaskColumn key={status} id={status} label={STATUS_LABELS[status]} count={columnTasks.length} borderColor={STATUS_COLORS[status]}>
              <SortableContext items={columnTasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
                {columnTasks.length === 0 ? (
                  <div className="text-gray-400 dark:text-gray-500 text-xs text-center py-4">Drop tasks here</div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {columnTasks.map(task => (
                      <SortableTaskCard
                        key={task.id}
                        task={task}
                        onDelete={onDelete}
                        onEdit={onEdit}
                        onOpenComments={onOpenComments}
                        commentCount={comments[task.id]?.length || 0}
                      />
                    ))}
                  </div>
                )}
              </SortableContext>
            </TaskColumn>
          );
        })}
      </div>
      <DragOverlay>
        {activeDragTask ? (
          <div className="bg-white rounded-lg p-4 shadow-lg border-2 border-blue-500 opacity-90">
            <p className="font-semibold">{activeDragTask.title}</p>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

export default TaskBoard;
