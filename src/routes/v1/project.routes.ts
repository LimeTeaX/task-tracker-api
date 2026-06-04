import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware';
import {
  createProjectValidator,
  updateProjectValidator,
  projectIdValidator,
  addMemberValidator,
  removeMemberValidator,
  listProjectsValidator,
} from '../../validators/project.validator';
import {
  createProjectController,
  getProjectController,
  listProjectsController,
  updateProjectController,
  deleteProjectController,
  addMemberController,
  removeMemberController,
  getMembersController,
} from '../../controllers/project.controller';

const router = Router();

// Semua endpoint project memerlukan authentication
router.use(authMiddleware);

// CRUD Projects
router.post('/', createProjectValidator, createProjectController);
router.get('/', listProjectsValidator, listProjectsController);
router.get('/:id', projectIdValidator, getProjectController);
router.put('/:id', updateProjectValidator, updateProjectController);
router.patch('/:id', updateProjectValidator, updateProjectController);
router.delete('/:id', projectIdValidator, deleteProjectController);

// Project Members
router.post('/:id/members', addMemberValidator, addMemberController);
router.get('/:id/members', projectIdValidator, getMembersController);
router.delete('/:id/members/:userId', removeMemberValidator, removeMemberController);

export default router;