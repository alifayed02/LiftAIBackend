import { supabase } from "./db.js";

export const TABLE = "workouts";

export async function createWorkout({ id = null, userId, title = null, notes = null, videoUrl, recordedAt = null }) {
  const payload = {
    user_id: userId,
    title,
    notes,
    video_url: videoUrl,
    recorded_at: recordedAt,
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

export async function getWorkoutById(id) {
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data;
}

export async function listWorkoutsByUser(userId, { limit = 100, offset = 0 } = {}) {
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

export async function updateWorkout(id, { title, notes, videoUrl, recordedAt } = {}) {
  const updates = {};
  if (title !== undefined) updates.title = title;
  if (notes !== undefined) updates.notes = notes;
  if (videoUrl !== undefined) updates.video_url = videoUrl;
  if (recordedAt !== undefined) updates.recorded_at = recordedAt;

  if (Object.keys(updates).length === 0) {
    return getWorkoutById(id);
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

export async function deleteWorkout(id) {
  const { data, error } = await supabase
    .from(TABLE)
    .delete()
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw error;
  return data;
}