import { Router } from 'express';

import usersRouter from './users.routes.js';
import workoutsRouter from './workouts.routes.js';

const router = Router();

router.use('/users', usersRouter);
router.use('/workouts', workoutsRouter);

export default router;