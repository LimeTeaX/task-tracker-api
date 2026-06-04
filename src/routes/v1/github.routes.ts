import { Router } from 'express';
import { authMiddleware } from '../../middleware/auth.middleware';
import {
  linkRepoValidator, syncCommitsValidator, getCommitsValidator,
} from '../../validators/github.validator';
import {
  linkRepoController, unlinkRepoController, syncCommitsController,
  getCommitsController, getLinkedRepoController,
} from '../../controllers/github.controller';

const router = Router();

router.use(authMiddleware);

router.post('/link', linkRepoValidator, linkRepoController);
router.post('/sync/:id', syncCommitsValidator, syncCommitsController);
router.get('/commits/:id', getCommitsValidator, getCommitsController);
router.get('/repo/:id', getCommitsValidator, getLinkedRepoController);
router.delete('/unlink/:id', getCommitsValidator, unlinkRepoController);

export default router;
