import { supabase } from "./supabase.js";

/**
 * Register a new user.
 * Returns { user } on success, throws an Error with a message on failure.
 */
export async function registerUser({ name, username, password }) {
  // 1. Check for duplicate username
  const { data: existing, error: lookupError } = await supabase
    .from("users")
    .select("id")
    .eq("username", username)
    .maybeSingle();

  if (lookupError) throw new Error(lookupError.message);
  if (existing)    throw new Error("Username already taken. Please choose another.");

  // 2. Insert new user (plain-text password — fine for this hackathon demo)
  const { data, error } = await supabase
    .from("users")
    .insert({ name, username, password })
    .select("id, name, username")
    .single();

  if (error) throw new Error(error.message);
  return { user: data };
}

/**
 * Log in an existing user.
 * Returns { user } on success, throws an Error on bad credentials.
 */
export async function loginUser({ username, password }) {
  const { data, error } = await supabase
    .from("users")
    .select("id, name, username")
    .eq("username", username)
    .eq("password", password)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data)  throw new Error("Invalid username or password.");

  return { user: data };
}
