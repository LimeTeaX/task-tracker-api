import { useState } from 'react';
import type { Repo, Commit } from '../types';
import Modal from './Modal';

interface GitHubPanelProps {
  repo: Repo | null;
  commits: Commit[];
  isOwner: boolean;
  onLinkRepo: (repoUrl: string) => Promise<void>;
  onUnlinkRepo: () => Promise<void>;
  onSyncCommits: () => Promise<void>;
  syncing: boolean;
}

const GitHubPanel = ({
  repo,
  commits,
  isOwner,
  onLinkRepo,
  onUnlinkRepo,
  onSyncCommits,
  syncing,
}: GitHubPanelProps) => {
  const [showLinkRepoModal, setShowLinkRepoModal] = useState(false);
  const [repoUrl, setRepoUrl] = useState('');

  const handleLinkRepo = async () => {
    if (!repoUrl.trim()) return;
    await onLinkRepo(repoUrl);
    setRepoUrl('');
    setShowLinkRepoModal(false);
  };

  return (
    <>
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm transition-colors">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold dark:text-white">GitHub Integration</h2>
          {isOwner && !repo && (
            <button
              onClick={() => setShowLinkRepoModal(true)}
              className="bg-blue-500 text-white px-3 py-1.5 rounded-md text-sm hover:bg-blue-600"
            >
              Link Repository
            </button>
          )}
        </div>

        {!repo ? (
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-300 mb-2">No GitHub repository linked</p>
            {!isOwner && <p className="text-sm text-gray-400 dark:text-gray-500">Only the project owner can link a repository</p>}
          </div>
        ) : (
          <div>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-md p-4 mb-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium dark:text-white">
                    <a
                      href={repo.repo_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {repo.repo_owner}/{repo.repo_name}
                    </a>
                  </p>
                  {repo.last_synced_at && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Last synced: {new Date(repo.last_synced_at).toLocaleString()}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={onSyncCommits}
                    disabled={syncing}
                    className="bg-green-500 text-white px-3 py-1.5 rounded-md text-sm hover:bg-green-600 disabled:opacity-50"
                  >
                    {syncing ? 'Syncing...' : 'Sync'}
                  </button>
                  {isOwner && (
                    <button
                      onClick={onUnlinkRepo}
                      className="text-red-500 text-sm hover:text-red-700 px-3 py-1.5"
                    >
                      Unlink
                    </button>
                  )}
                </div>
              </div>
            </div>

            <h3 className="font-semibold mb-3 dark:text-white">Recent Commits ({commits.length})</h3>
            {commits.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-300 text-sm">No commits synced yet. Click "Sync" to fetch commits.</p>
            ) : (
              <div className="flex flex-col gap-2 max-h-80 overflow-y-auto">
                {commits.map(commit => (
                  <div key={commit.id} className="bg-gray-50 dark:bg-gray-700/50 rounded-md p-3 border border-gray-200 dark:border-gray-600">
                    <div className="flex justify-between items-start">
                      <div className="flex-1 mr-2">
                        <p className="text-sm font-medium truncate dark:text-gray-200">{commit.message.split('\n')[0]}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {commit.author} &middot; {new Date(commit.commit_date).toLocaleDateString()}
                        </p>
                      </div>
                      <a
                        href={commit.commit_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:underline whitespace-nowrap"
                      >
                        {commit.commit_sha.slice(0, 7)}
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <Modal isOpen={showLinkRepoModal} onClose={() => setShowLinkRepoModal(false)} title="Link GitHub Repository">
        <p className="text-sm text-gray-500 dark:text-gray-300 mb-3">Enter the GitHub repository URL (e.g. https://github.com/owner/repo).</p>
        <input
          type="text" placeholder="https://github.com/owner/repo"
          value={repoUrl}
          onChange={(e) => setRepoUrl(e.target.value)}
          className="w-full border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 mb-4 bg-white dark:bg-gray-700 dark:text-gray-200"
        />
        <div className="flex justify-end gap-2">
          <button onClick={() => setShowLinkRepoModal(false)} className="px-4 py-2 bg-gray-200 dark:bg-gray-600 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-500">Cancel</button>
          <button onClick={handleLinkRepo} className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600">Link</button>
        </div>
      </Modal>
    </>
  );
};

export default GitHubPanel;
