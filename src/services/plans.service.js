import * as PlansModel from '../models/plans.model.js';

export async function getById(planId) {
  const plan = await PlansModel.getPlanById(planId);
  if (!plan) {
    const err = new Error('Plan not found');
    err.status = 404;
    throw err;
  }
  return plan;
}

export async function list(options = {}) {
  const { limit = 100, offset = 0 } = options;
  const plans = await PlansModel.listPlans({ limit, offset });
  return plans;
}


