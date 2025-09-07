import { Router } from 'express';
import * as workoutsController from '../../controllers/workouts.controller.js';

const router = Router();

router.get('/id/:id', workoutsController.getWorkoutById);
router.get('/user/:userId', workoutsController.listWorkoutsByUser);

router.post('/create', workoutsController.createWorkout);
router.patch('/:id', workoutsController.updateWorkout);
router.delete('/:id', workoutsController.deleteWorkout);

export default router;