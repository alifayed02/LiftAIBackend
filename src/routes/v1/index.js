import { Router } from 'express';

import usersRouter from './users.routes.js';
import workoutsRouter from './workouts.routes.js';
import subscriptionsRouter from './subscriptions.routes.js';
import plansRouter from './plans.routes.js';

const router = Router();

router.use('/users', usersRouter);
router.use('/workouts', workoutsRouter);
router.use('/subscriptions', subscriptionsRouter);
router.use('/plans', plansRouter);

export default router;