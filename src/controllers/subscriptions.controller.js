import { asyncHandler } from '../middlewares/async.js';
import * as subscriptionsService from '../services/subscriptions.service.js';

export const getSubscriptionById = asyncHandler(async (req, res) => {
    const id = req.params.id;
    const subscription = await subscriptionsService.getById(id);
    res.json(subscription);
});

export const listSubscriptions = asyncHandler(async (req, res) => {
    const limit = req.query.limit ? Number(req.query.limit) : undefined;
    const offset = req.query.offset ? Number(req.query.offset) : undefined;
    const subscriptions = await subscriptionsService.list({ limit, offset });
    res.json(subscriptions);
});

export const listSubscriptionsByUser = asyncHandler(async (req, res) => {
    const userId = req.params.userId;
    const limit = req.query.limit ? Number(req.query.limit) : undefined;
    const offset = req.query.offset ? Number(req.query.offset) : undefined;
    const subscriptions = await subscriptionsService.listByUser(userId, { limit, offset });
    res.json(subscriptions);
});

export const createSubscription = asyncHandler(async (req, res) => {
    const subscription = await subscriptionsService.create(req.body);
    res.json(subscription);
});

export const updateSubscription = asyncHandler(async (req, res) => {
    const id = req.params.id;
    const subscription = await subscriptionsService.update(id, req.body);
    res.json(subscription);
});

export const deleteSubscription = asyncHandler(async (req, res) => {
    const id = req.params.id;
    const subscription = await subscriptionsService.remove(id);
    res.json(subscription);
});


