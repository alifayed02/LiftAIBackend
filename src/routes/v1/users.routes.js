import { Router } from 'express';
import * as usersController from '../../controllers/users.controller.js';

const router = Router();

router.get('/id/:id', usersController.getUserById);
router.get('/email/:email', usersController.getUserByEmail);

router.post('/create', usersController.createUser);

export default router;