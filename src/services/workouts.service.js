import * as WorkoutsModel from '../models/workouts.model.js';
import * as UsersModel from '../models/users.model.js';

export async function getById(workoutId) {
  const workout = await WorkoutsModel.getWorkoutById(workoutId);
  if (!workout) {
    const err = new Error('Workout not found');
    err.status = 404;
    throw err;
  }
  return workout;
}

export async function listByUser(userId, options = {}) {
  const { limit = 100, offset = 0 } = options;
  const workouts = await WorkoutsModel.listWorkoutsByUser(userId, { limit, offset });
  return workouts;
}

export async function create(workout) {
  // Basic input validation (controller does plan checks early)
  const userIdFromPayload = workout && workout.userId;
  if (!userIdFromPayload) {
    const err = new Error('userId is required');
    err.status = 400;
    throw err;
  }

  const newWorkout = await WorkoutsModel.createWorkout(workout);
  if (!newWorkout) {
    const err = new Error('Failed to create workout');
    err.status = 500;
    throw err;
  }
  // Increment the user's videos count; ignore failures to not block workout creation
  try {
    const userId = newWorkout.user_id;
    if (userId) {
      const user = await UsersModel.getUserById(userId);
      const currentVideos = (user && typeof user.videos === 'number') ? user.videos : 0;
      await UsersModel.updateUser(userId, { videos: currentVideos + 1 });
    }
  } catch (_) {
    // Intentionally ignore update failures
  }
  return newWorkout;
}

export async function update(workoutId, updates) {
  const updated = await WorkoutsModel.updateWorkout(workoutId, updates);
  if (!updated) {
    const err = new Error('Workout not found');
    err.status = 404;
    throw err;
  }
  return updated;
}

export async function remove(workoutId) {
  const deleted = await WorkoutsModel.deleteWorkout(workoutId);
  if (!deleted) {
    const err = new Error('Workout not found');
    err.status = 404;
    throw err;
  }
  return deleted;
}