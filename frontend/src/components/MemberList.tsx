import { useState } from 'react';
import Modal from './Modal';
import { Member } from '../types';

interface MemberListProps {
  members: Member[];
  isOwner: boolean;
  currentUserId: string;
  onAddMember: (email: string) => Promise<void>;
  onRemoveMember: (userId: string) => void;
}

function MemberList({ members, isOwner, currentUserId, onAddMember, onRemoveMember }: MemberListProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newMemberEmail, setNewMemberEmail] = useState('');

  const handleAdd = async () => {
    if (!newMemberEmail.trim()) return;
    await onAddMember(newMemberEmail);
    setShowAddModal(false);
    setNewMemberEmail('');
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm transition-colors">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold dark:text-white">Team Members</h2>
        {isOwner && (
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-blue-500 text-white px-3 py-1.5 rounded-md text-sm hover:bg-blue-600"
          >
            + Add Member
          </button>
        )}
      </div>

      {members.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-300 text-center py-8">No members yet</p>
      ) : (
        <div className="flex flex-col gap-2">
          {members.map(member => (
            <div key={member.id} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
              <div>
                <p className="font-medium dark:text-white">{member.name}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{member.email}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs bg-gray-200 dark:bg-gray-600 px-2 py-1 rounded-full capitalize dark:text-gray-200">
                  {member.project_role}
                </span>
                {isOwner && member.id !== currentUserId && (
                  <button
                    onClick={() => onRemoveMember(member.id)}
                    className="text-red-500 text-sm hover:text-red-700"
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add Member">
        <p className="text-sm text-gray-500 dark:text-gray-300 mb-3">Enter the user email to add them to this project.</p>
        <input
          type="text" placeholder="User Email"
          value={newMemberEmail}
          onChange={(e) => setNewMemberEmail(e.target.value)}
          className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 mb-4 bg-white dark:bg-gray-700 dark:text-gray-200"
        />
        <div className="flex justify-end gap-2">
          <button onClick={() => setShowAddModal(false)} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500">Cancel</button>
          <button onClick={handleAdd} className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600">Add Member</button>
        </div>
      </Modal>
    </div>
  );
}

export default MemberList;
