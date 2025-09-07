import { supabase } from "./db.js";

export const TABLE = "users";

export async function createUser({ id = null, email }) {
  const payload = {
    email,
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

export async function getUserById(id) {
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data;
}

export async function getUserByEmail(email) {
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("email", email)
    .single();

  if (error) throw error;
  return data;
}

export async function listUsers({ limit = 100, offset = 0 } = {}) {
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

export async function updateUser(id, { email } = {}) {
  const updates = {};
  if (email !== undefined) updates.email = email;

  if (Object.keys(updates).length === 0) {
    return getUserById(id);
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

export async function deleteUser(id) {
  const { data, error } = await supabase
    .from(TABLE)
    .delete()
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw error;
  return data;
}


