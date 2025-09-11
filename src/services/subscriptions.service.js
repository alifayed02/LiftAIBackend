import * as SubscriptionsModel from '../models/subscriptions.model.js';

export async function getById(subscriptionId) {
  const subscription = await SubscriptionsModel.getSubscriptionById(subscriptionId);
  if (!subscription) {
    const err = new Error('Subscription not found');
    err.status = 404;
    throw err;
  }
  return subscription;
}

export async function list(options = {}) {
  const { limit = 100, offset = 0 } = options;
  const subscriptions = await SubscriptionsModel.listSubscriptions({ limit, offset });
  return subscriptions;
}

export async function listByUser(userId, options = {}) {
  const { limit = 100, offset = 0 } = options;
  const subscriptions = await SubscriptionsModel.listSubscriptionsByUser(userId, { limit, offset });
  return subscriptions;
}

export async function create(subscription) {
  const newSubscription = await SubscriptionsModel.createSubscription(subscription);
  if (!newSubscription) {
    const err = new Error('Failed to create subscription');
    err.status = 500;
    throw err;
  }
  return newSubscription;
}

export async function update(subscriptionId, updates) {
  const updated = await SubscriptionsModel.updateSubscription(subscriptionId, updates);
  if (!updated) {
    const err = new Error('Subscription not found');
    err.status = 404;
    throw err;
  }
  return updated;
}

export async function remove(subscriptionId) {
  const deleted = await SubscriptionsModel.deleteSubscription(subscriptionId);
  if (!deleted) {
    const err = new Error('Subscription not found');
    err.status = 404;
    throw err;
  }
  return deleted;
}


