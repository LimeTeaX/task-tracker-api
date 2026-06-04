import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware';
import {
  createTaskValidator,
  updateTaskValidator,
  taskIdValidator,
  updateStatusValidator,
  assignTaskValidator,
  listTasksValidator,
} from '../../validators/task.validator';
import {
  createTaskController,
  getTaskController,
  listTasksController,
  updateTaskController,
  deleteTaskController,
  updateStatusController,
  assignTaskController,
} from '../../controllers/task.controller';

const router = Router();

router.use(authMiddleware);

router.post('/', createTaskValidator, createTaskController);
router.get('/', listTasksValidator, listTasksController);
router.get('/:id', taskIdValidator, getTaskController);
router.put('/:id', updateTaskValidator, updateTaskController);
router.patch('/:id', updateTaskValidator, updateTaskController);
router.delete('/:id', taskIdValidator, deleteTaskController);
router.patch('/:id/status', updateStatusValidator, updateStatusController);
router.post('/:id/assign', assignTaskValidator, assignTaskController);

export default router;