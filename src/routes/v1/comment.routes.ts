import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware';
import {
  createCommentValidator,
  taskIdParamValidator,
  deleteCommentValidator,
} from '../../validators/comment.validator';
import {
  createCommentController, getTaskCommentsController, deleteCommentController,
} from '../../controllers/comment.controller';

const router = Router();

router.use(authMiddleware);

router.get('/task/:taskId/comments', taskIdParamValidator, getTaskCommentsController);
router.post('/task/:taskId/comments', createCommentValidator, createCommentController);
router.delete('/comments/:id', deleteCommentValidator, deleteCommentController);

export default router;
