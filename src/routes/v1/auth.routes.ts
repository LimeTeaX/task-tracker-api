import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { registerController, loginController, logoutController, refreshController } from '../../controllers/auth.controller';
import { registerValidator, loginValidator } from '../../validators/auth.validator';

const router = Router();

const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: 'Too many auth attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

router.use(authLimiter);

router.post('/register', registerValidator, registerController);
router.post('/login', loginValidator, loginController);
router.post('/logout', logoutController);
router.post('/refresh', refreshController);

export default router;