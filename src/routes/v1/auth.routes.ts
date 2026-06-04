import { Router } from 'express';
import { registerController, loginController, logoutController, refreshController } from '../../controllers/auth.controller';
import { registerValidator, loginValidator } from '../../validators/auth.validator';

const router = Router();

router.post('/register', registerValidator, registerController);
router.post('/login', loginValidator, loginController);
router.post('/logout', logoutController);
router.post('/refresh', refreshController);

export default router;