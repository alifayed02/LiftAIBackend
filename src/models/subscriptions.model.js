import { supabase } from "./db.js";

export const TABLE = "subscriptions";

export async function createSubscription({
  id = null,
  userId,
  planId,
  status,
  currentPeriodStart = null,
  currentPeriodEnd = null,
  cancelAtPeriodEnd = false,
}) {
  const payload = {
    user_id: userId,
    plan_id: planId,
    status,
    current_period_start: currentPeriodStart,
    current_period_end: currentPeriodEnd,
    cancel_at_period_end: cancelAtPeriodEnd,
  };
  if (id) payload.id = id;

  const { data, error } = await supabase
    .from(TABLE)
    .insert([payload])
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export async function getSubscriptionById(id) {
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data;
}

export async function listSubscriptions({ limit = 100, offset = 0 } = {}) {
  const rangeStart = offset;
  const rangeEnd = offset + limit - 1;

  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .order("created_at", { ascending: false })
    .range(rangeStart, rangeEnd);

  if (error) throw error;
  return data;
}

export async function listSubscriptionsByUser(userId, { limit = 100, offset = 0 } = {}) {
  const rangeStart = offset;
  const rangeEnd = offset + limit - 1;

  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .range(rangeStart, rangeEnd);

  if (error) throw error;
  return data;
}

export async function updateSubscription(id, {
  planId,
  status,
  currentPeriodStart,
  currentPeriodEnd,
  cancelAtPeriodEnd,
} = {}) {
  const updates = {};
  if (planId !== undefined) updates.plan_id = planId;
  if (status !== undefined) updates.status = status;
  if (currentPeriodStart !== undefined) updates.current_period_start = currentPeriodStart;
  if (currentPeriodEnd !== undefined) updates.current_period_end = currentPeriodEnd;
  if (cancelAtPeriodEnd !== undefined) updates.cancel_at_period_end = cancelAtPeriodEnd;

  if (Object.keys(updates).length === 0) {
    return getSubscriptionById(id);
  }

  const { data, error } = await supabase
    .from(TABLE)
    .update(updates)
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export async function deleteSubscription(id) {
  const { data, error } = await supabase
    .from(TABLE)
    .delete()
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw error;
  return data;
}


