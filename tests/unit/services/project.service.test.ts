import { NotFoundError, ForbiddenError, BadRequestError } from '../../../src/utils/errors';

const mockQueryBuilder = (overrides: Record<string, any> = {}) => {
  const builder: any = {
    _resolveValue: [],
    then: function (onFulfilled: any, onRejected?: any) {
      return Promise.resolve(this._resolveValue).then(onFulfilled, onRejected);
    },
    catch: function (onRejected: any) {
      return Promise.resolve(this._resolveValue).catch(onRejected);
    },
    finally: function (onFinally: any) {
      return Promise.resolve(this._resolveValue).finally(onFinally);
    },
    where: jest.fn().mockImplementation(function (this: any, ...args: any[]) {
      if (typeof args[0] === 'function') args[0].call(this);
      return this;
    }),
    orWhere: jest.fn().mockReturnThis(),
    insert: jest.fn().mockResolvedValue(undefined),
    first: jest.fn().mockResolvedValue(undefined),
    update: jest.fn().mockResolvedValue(undefined),
    del: jest.fn().mockResolvedValue(1),
    join: jest.fn().mockReturnThis(),
    leftJoin: jest.fn().mockReturnThis(),
    whereIn: jest.fn().mockReturnThis(),
    whereNull: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    count: jest.fn().mockReturnThis(),
    countDistinct: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    distinct: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    offset: jest.fn().mockReturnThis(),
    clone: jest.fn().mockReturnThis(),
    returning: jest.fn().mockReturnThis(),
    ...overrides,
  };
  return builder;
};

jest.mock('../../../src/config/database', () => ({
  db: jest.fn(),
  testDatabaseConnection: jest.fn(),
}));

jest.mock('../../../src/utils/access', () => ({
  hasProjectAccess: jest.fn(),
  isProjectManager: jest.fn(),
}));

jest.mock('uuid', () => ({
  v4: jest.fn().mockReturnValue('fixed-uuid'),
}));

import { db } from '../../../src/config/database';
import { hasProjectAccess, isProjectManager } from '../../../src/utils/access';
import * as projectService from '../../../src/services/project.service';

describe('project.service', () => {
  const ownerId = 'owner-1';
  const userId = 'user-1';
  const projectId = 'project-1';

  const mockProject = {
    id: projectId,
    name: 'Test Project',
    description: 'A test project',
    owner_id: ownerId,
    status: 'active',
    created_at: new Date(),
    updated_at: new Date(),
    deleted_at: null,
  };

  let queryBuilder: ReturnType<typeof mockQueryBuilder>;

  beforeEach(() => {
    jest.clearAllMocks();
    queryBuilder = mockQueryBuilder();
    (db as unknown as jest.Mock).mockReturnValue(queryBuilder);
  });

  describe('createProject', () => {
    it('should create a project and add owner as manager', async () => {
      queryBuilder.first = jest.fn().mockResolvedValue(mockProject);

      const result = await projectService.createProject({
        name: 'Test Project',
        description: 'A test project',
        ownerId,
      });

      expect(db).toHaveBeenCalledWith('projects');
      expect(db).toHaveBeenCalledWith('project_members');
      expect(queryBuilder.insert).toHaveBeenCalledTimes(2);
      expect(result).toEqual({ ...mockProject, members_count: 1 });
    });
  });

  describe('getProjectById', () => {
    it('should return project with members count', async () => {
      queryBuilder.first = jest.fn()
        .mockResolvedValueOnce(mockProject)
        .mockResolvedValueOnce({ count: '3' });
      (hasProjectAccess as jest.Mock).mockResolvedValue(true);

      const result = await projectService.getProjectById(projectId, userId);

      expect(result).toEqual({ ...mockProject, members_count: 3 });
    });

    it('should throw NotFoundError if project does not exist', async () => {
      queryBuilder.first = jest.fn().mockResolvedValue(undefined);

      await expect(
        projectService.getProjectById(projectId, userId)
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw ForbiddenError if user has no access', async () => {
      queryBuilder.first = jest.fn().mockResolvedValue(mockProject);
      (hasProjectAccess as jest.Mock).mockResolvedValue(false);

      await expect(
        projectService.getProjectById(projectId, userId)
      ).rejects.toThrow(ForbiddenError);
    });
  });

  describe('listProjects', () => {
    it('should return paginated projects', async () => {
      queryBuilder._resolveValue = [mockProject];

      const countsBuilder = mockQueryBuilder({ _resolveValue: [] });
      countsBuilder.whereIn = jest.fn().mockReturnThis();
      countsBuilder.groupBy = jest.fn().mockReturnThis();
      countsBuilder.select = jest.fn().mockReturnThis();
      countsBuilder.count = jest.fn().mockReturnThis();

      (db as unknown as jest.Mock)
        .mockReturnValueOnce(queryBuilder)
        .mockReturnValueOnce(countsBuilder);

      const result = await projectService.listProjects(userId, { page: 1, limit: 20 });

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('pagination');
      expect(result.data).toEqual([{ ...mockProject, members_count: 0 }]);
    });
  });

  describe('updateProject', () => {
    it('should update and return project', async () => {
      queryBuilder.first = jest.fn()
        .mockResolvedValueOnce(mockProject)
        .mockResolvedValueOnce(mockProject)
        .mockResolvedValueOnce({ count: '2' });
      (isProjectManager as jest.Mock).mockResolvedValue(true);

      const result = await projectService.updateProject(projectId, userId, {
        name: 'Updated Project',
      });

      expect(queryBuilder.update).toHaveBeenCalled();
      expect(result).toEqual({ ...mockProject, members_count: 2 });
    });

    it('should throw NotFoundError if project does not exist', async () => {
      queryBuilder.first = jest.fn().mockResolvedValue(undefined);

      await expect(
        projectService.updateProject(projectId, userId, { name: 'Updated' })
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw ForbiddenError if user is not a manager', async () => {
      queryBuilder.first = jest.fn().mockResolvedValue(mockProject);
      (isProjectManager as jest.Mock).mockResolvedValue(false);

      await expect(
        projectService.updateProject(projectId, userId, { name: 'Updated' })
      ).rejects.toThrow(ForbiddenError);
    });
  });

  describe('deleteProject', () => {
    it('should soft delete by default', async () => {
      queryBuilder.first = jest.fn().mockResolvedValue(mockProject);

      const result = await projectService.deleteProject(projectId, ownerId);

      expect(queryBuilder.update).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should hard delete when specified', async () => {
      queryBuilder.first = jest.fn().mockResolvedValue(mockProject);
      queryBuilder.del = jest.fn().mockResolvedValue(1);

      const result = await projectService.deleteProject(projectId, ownerId, true);

      expect(queryBuilder.del).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should throw NotFoundError if project does not exist', async () => {
      queryBuilder.first = jest.fn().mockResolvedValue(undefined);

      await expect(
        projectService.deleteProject(projectId, ownerId)
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw ForbiddenError if user is not the owner', async () => {
      queryBuilder.first = jest.fn().mockResolvedValue(mockProject);

      await expect(
        projectService.deleteProject(projectId, 'other-user')
      ).rejects.toThrow(ForbiddenError);
    });
  });

  describe('addProjectMember', () => {
    const targetUser = { id: 'user-2', name: 'User 2', email: 'user2@example.com' };

    it('should add a member by user ID', async () => {
      (isProjectManager as jest.Mock).mockResolvedValue(true);
      queryBuilder.first = jest.fn()
        .mockResolvedValueOnce(mockProject)
        .mockResolvedValueOnce(targetUser)
        .mockResolvedValueOnce(undefined);

      const result = await projectService.addProjectMember(projectId, userId, 'user-2', 'member');

      expect(result).toEqual({
        success: true,
        message: 'Member added successfully',
        user: { id: 'user-2', name: 'User 2', email: 'user2@example.com' },
      });
    });

    it('should add a member by email', async () => {
      (isProjectManager as jest.Mock).mockResolvedValue(true);
      queryBuilder.first = jest.fn()
        .mockResolvedValueOnce(mockProject)
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(targetUser)
        .mockResolvedValueOnce(undefined);

      const result = await projectService.addProjectMember(projectId, userId, 'user2@example.com', 'member');

      expect(result.user.email).toBe('user2@example.com');
    });

    it('should throw ForbiddenError if user is not a manager', async () => {
      (isProjectManager as jest.Mock).mockResolvedValue(false);

      await expect(
        projectService.addProjectMember(projectId, userId, 'user-2')
      ).rejects.toThrow(ForbiddenError);
    });

    it('should throw BadRequestError if user is already a member', async () => {
      (isProjectManager as jest.Mock).mockResolvedValue(true);
      queryBuilder.first = jest.fn()
        .mockResolvedValueOnce(mockProject)
        .mockResolvedValueOnce(targetUser)
        .mockResolvedValueOnce({ id: 'existing' });

      await expect(
        projectService.addProjectMember(projectId, userId, 'user-2')
      ).rejects.toThrow(BadRequestError);
    });
  });

  describe('removeProjectMember', () => {
    it('should remove a member', async () => {
      (isProjectManager as jest.Mock).mockResolvedValue(true);
      queryBuilder.first = jest.fn().mockResolvedValue(mockProject);
      queryBuilder.del = jest.fn().mockResolvedValue(1);

      const result = await projectService.removeProjectMember(projectId, userId, 'user-2');

      expect(result).toEqual({ success: true, message: 'Member removed successfully' });
    });

    it('should throw BadRequestError when trying to remove the owner', async () => {
      (isProjectManager as jest.Mock).mockResolvedValue(true);
      queryBuilder.first = jest.fn().mockResolvedValue(mockProject);

      await expect(
        projectService.removeProjectMember(projectId, userId, ownerId)
      ).rejects.toThrow(BadRequestError);
    });

    it('should throw NotFoundError if member not found', async () => {
      (isProjectManager as jest.Mock).mockResolvedValue(true);
      queryBuilder.first = jest.fn().mockResolvedValue(mockProject);
      queryBuilder.del = jest.fn().mockResolvedValue(0);

      await expect(
        projectService.removeProjectMember(projectId, userId, 'user-2')
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('getProjectMembers', () => {
    const mockMembers = [
      { id: 'user-1', email: 'user1@example.com', name: 'User 1', system_role: 'member', project_role: 'manager', joined_at: new Date() },
    ];

    it('should return project members', async () => {
      (hasProjectAccess as jest.Mock).mockResolvedValue(true);
      const builder = mockQueryBuilder({ _resolveValue: mockMembers });
      builder.join = jest.fn().mockReturnThis();
      builder.where = jest.fn().mockReturnThis();
      builder.select = jest.fn().mockReturnThis();
      (db as unknown as jest.Mock).mockReturnValue(builder);

      const result = await projectService.getProjectMembers(projectId, userId);

      expect(result).toEqual(mockMembers);
    });

    it('should throw ForbiddenError if user has no access', async () => {
      (hasProjectAccess as jest.Mock).mockResolvedValue(false);

      await expect(
        projectService.getProjectMembers(projectId, userId)
      ).rejects.toThrow(ForbiddenError);
    });
  });
});
