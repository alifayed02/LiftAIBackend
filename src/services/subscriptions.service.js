import * as SubscriptionsModel from '../models/subscriptions.model.js';
import * as PlansModel from '../models/plans.model.js';
import { supabase } from '../models/db.js';

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

export async function syncFromRevenueCat(userId) {
  const r = await fetch(`https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(userId)}`, {
    headers: { Authorization: `Bearer ${process.env.RC_REST_API_KEY}`},
  });
  if (!r.ok) {
    const err = new Error('RevenueCat error');
    err.status = r.status;
    err.message = `RevenueCat ${r.status} error`;
    throw err;
  }
  const { subscriber } = await r.json();

  const ent = subscriber?.entitlements?.active?.pro;
  const productId = ent?.product_identifier ?? null;
  const sub = productId ? subscriber?.subscriptions?.[productId] ?? {} : {};

  const now = new Date();
  const expires = ent?.expires_date ? new Date(ent.expires_date) : null;
  const active = !!expires && expires > now;
  const inTrial = (sub.period_type || ent?.period_type) === 'trial' && active;
  const pastDue = !!sub.billing_issues_detected_at && active;

  const status = inTrial ? 'trialing' : pastDue ? 'past_due' : active ? 'active' : 'canceled';
  const current_period_start = sub.latest_purchase_date ? new Date(sub.latest_purchase_date) : null;
  const current_period_end = expires;
  const cancel_at_period_end = active && sub.will_renew === false;

  // Ensure plan exists (if any). If no productId, fallback to 'free'
  const planId = productId || 'free';
  if (planId) {
    try {
      // Try to create; if it exists, we'll ignore the unique violation
      await PlansModel.createPlan({ id: planId, name: planId, priceCents: 0, interval: 'month' });
    } catch (_) {
      // ignore errors (e.g., already exists)
    }
  }

  console.log(planId, status, current_period_start, current_period_end, cancel_at_period_end);

  // Upsert subscription by user_id
  const { data, error } = await supabase
    .from('subscriptions')
    .upsert({
      user_id: userId,
      plan_id: planId,
      status,
      current_period_start,
      current_period_end,
      cancel_at_period_end,
    }, { onConflict: 'user_id' })
    .select('*')
    .single();

  if (error) throw error;
  return data;
}