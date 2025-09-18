import { supabase } from "./db.js";

export const TABLE = "plans";

export async function getPlanById(id) {
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data;
}

export async function listPlans({ limit = 100, offset = 0 } = {}) {
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

export async function createPlan({ id, name = id, priceCents = 0, interval = 'month' }) {
  const payload = {
    id,
    name,
    price_cents: priceCents,
    interval,
  };

  const { data, error } = await supabase
    .from(TABLE)
    .insert([payload])
    .select("*")
    .single();

  if (error) throw error;
  return data;
}