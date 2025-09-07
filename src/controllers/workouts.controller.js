import { asyncHandler } from '../middlewares/async.js';
import * as workoutsService from '../services/workouts.service.js';
import * as gemini from '../helpers/gemini.js';

export const getWorkoutById = asyncHandler(async (req, res) => {
    const id = req.params.id;
    const workout = await workoutsService.getById(id);
    res.json(workout);
});

export const listWorkoutsByUser = asyncHandler(async (req, res) => {
    const userId = req.params.userId;
    const limit = req.query.limit ? Number(req.query.limit) : undefined;
    const offset = req.query.offset ? Number(req.query.offset) : undefined;
    const workouts = await workoutsService.listByUser(userId, { limit, offset });
    res.json(workouts);
});

export const createWorkout = asyncHandler(async (req, res) => {
    const videoPath = req.body.videoPath;
    const userId = req.body.userId;
    const metadata = req.body.metadata;

    const width = metadata.width;
    const height = metadata.height;

    const analysis = await gemini.geminiAnalysis(videoPath);
    const analyzedWorkout = await gemini.overlayAnalysis(videoPath, analysis, width, height);

    const title = analysis.exercise;
    const notes = "";
    const videoUrl = analyzedWorkout;
    const recordedAt = new Date();

    const workout = await workoutsService.create({ userId, title, notes, videoUrl, recordedAt });
    res.json(workout);
});

export const updateWorkout = asyncHandler(async (req, res) => {
    const id = req.params.id;
    const workout = await workoutsService.update(id, req.body);
    res.json(workout);
});

export const deleteWorkout = asyncHandler(async (req, res) => {
    const id = req.params.id;
    const workout = await workoutsService.remove(id);
    res.json(workout);
});