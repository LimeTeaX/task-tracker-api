import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware';
import { body, param } from 'express-validator';
import {
  createCommentController, getTaskCommentsController, deleteCommentController,
} from '../../controllers/comment.controller';

const router = Router();

router.use(authMiddleware);

router.get('/task/:taskId/comments', [
  param('taskId').isUUID().withMessage('Invalid task ID format'),
], getTaskCommentsController);

router.post('/task/:taskId/comments', [
  param('taskId').isUUID().withMessage('Invalid task ID format'),
  body('comment').isLength({ min: 1, max: 2000 }).withMessage('Comment must be between 1 and 2000 characters').trim(),
], createCommentController);

router.delete('/comments/:id', [
  param('id').isUUID().withMessage('Invalid comment ID format'),
], deleteCommentController);

export default router;
