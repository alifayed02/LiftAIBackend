import * as UsersModel from '../models/users.model.js';
import * as SubscriptionsService from './subscriptions.service.js';
import { supabase } from '../models/db.js';

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
        await SubscriptionsService.syncFromRevenueCat(newUser.id);
    } catch (_) {
        // Intentionally ignore subscription creation failures to not block user creation
    }
    return newUser;
}

export async function remove(userId) {
    // Delete from Supabase Auth first
    const { error: authError } = await supabase.auth.admin.deleteUser(userId);
    if (authError) {
        const err = new Error(`Failed to delete auth user: ${authError.message || 'unknown error'}`);
        err.status = 500;
        throw err;
    }

    // Then delete from application users table
    const deleted = await UsersModel.deleteUser(userId);
    if (!deleted) {
        const err = new Error('User not found');
        err.status = 404;
        throw err;
    }
    return deleted;
}