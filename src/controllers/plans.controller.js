import { asyncHandler } from '../middlewares/async.js';
import * as plansService from '../services/plans.service.js';

export const getPlanById = asyncHandler(async (req, res) => {
    const id = req.params.id;
    const plan = await plansService.getById(id);
    res.json(plan);
});

export const listPlans = asyncHandler(async (req, res) => {
    const limit = req.query.limit ? Number(req.query.limit) : undefined;
    const offset = req.query.offset ? Number(req.query.offset) : undefined;
    const plans = await plansService.list({ limit, offset });
    res.json(plans);
});


