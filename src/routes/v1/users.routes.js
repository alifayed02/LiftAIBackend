import { Router } from 'express';
import * as usersController from '../../controllers/users.controller.js';

const router = Router();

router.get('/id/:id', usersController.getUserById);
router.get('/email/:email', usersController.getUserByEmail);

router.post('/create', usersController.createUser);

router.delete('/:id', usersController.deleteUser);

export default router;