import { asyncHandler } from '../middlewares/async.js';
import * as usersService from '../services/users.service.js';

export const getUserById = asyncHandler(async (req, res) => {
    const id = req.params.id;
    const user = await usersService.getById(id);
    res.json(user);
});

export const getUserByEmail = asyncHandler(async (req, res) => {
    const email = req.params.email;
    console.log(email);
    const user = await usersService.getByEmail(email);
    res.json(user);
});

export const createUser = asyncHandler(async (req, res) => {
    const user = await usersService.create(req.body);
    res.json(user);
});