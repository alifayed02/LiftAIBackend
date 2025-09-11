import * as UsersModel from '../models/users.model.js';
import * as SubscriptionsService from './subscriptions.service.js';

export async function getById(userId) {
  const user = await UsersModel.getUserById(userId);
  if (!user) {
    const err = new Error('User not found');
    err.status = 404;
    throw err;
  }
  return user;
}

export async function getByEmail(email) {
    const user = await UsersModel.getUserByEmail(email);
    if (!user) {
        const err = new Error('User not found');
        err.status = 404;
        throw err;
    }
    return user;
}

export async function create(user) {
    const newUser = await UsersModel.createUser(user);
    if (!newUser) {
        const err = new Error('Failed to create user');
        err.status = 500;
        throw err;
    }
    try {
        await SubscriptionsService.create({
            userId: newUser.id,
            planId: 'free',
            status: 'active',
        });
    } catch (_) {
        // Intentionally ignore subscription creation failures to not block user creation
    }
    return newUser;
}