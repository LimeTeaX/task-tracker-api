import { useState } from 'react';
import Modal from './Modal';
import { Comment } from '../types';

interface CommentSectionProps {
  isOpen: boolean;
  taskId: string | null;
  comments: Comment[];
  currentUserId: string;
  onAddComment: (comment: string) => Promise<void>;
  onDeleteComment: (commentId: string) => Promise<void>;
  onClose: () => void;
}

const CommentSection = ({
  isOpen,
  taskId,
  comments,
  currentUserId,
  onAddComment,
  onDeleteComment,
  onClose,
}: CommentSectionProps) => {
  const [newComment, setNewComment] = useState('');

  const handleAdd = async () => {
    if (!newComment.trim()) return;
    await onAddComment(newComment);
    setNewComment('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleAdd();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Comments">
      <div className="space-y-4">
        {comments.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-sm text-center">
            No comments yet
          </p>
        ) : (
          <div className="space-y-4 max-h-80 overflow-y-auto">
            {comments.map((c) => (
              <div
                key={c.id}
                className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 border border-gray-200 dark:border-gray-600"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-gray-900 dark:text-gray-100">
                      {c.user_name}
                    </p>
                    <p className="text-sm text-gray-700 dark:text-gray-300 mt-1 break-words">
                      {c.comment}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      {new Date(c.created_at).toLocaleString()}
                    </p>
                  </div>
                  {c.user_id === currentUserId && (
                    <button
                      onClick={() => onDeleteComment(c.id)}
                      className="text-red-500 dark:text-red-400 text-sm hover:underline ml-2 shrink-0"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-2 border-t border-gray-200 dark:border-gray-600 pt-4">
          <input
            type="text"
            placeholder="Write a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-700 dark:text-gray-200"
          />
          <button
            onClick={handleAdd}
            disabled={!newComment.trim()}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default CommentSection;
