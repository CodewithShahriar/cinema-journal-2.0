import type { User } from "@supabase/supabase-js";
import { supabase } from "./supabase";

function requireSupabase() {
  if (!supabase) throw new Error("Supabase is not configured.");
  return supabase;
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export interface PasswordStrength {
  score: number; // 0 to 4
  label: "Too weak" | "Weak" | "Fair" | "Good" | "Strong";
  color: string;
}

export function checkPasswordStrength(password: string): PasswordStrength {
  if (!password || password.length < 6) {
    return { score: 0, label: "Too weak", color: "bg-red-500" };
  }

  let score = 1;
  if (password.length >= 8) score++;
  if (/[0-9]/.test(password) || /[^A-Za-z0-9]/.test(password)) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;

  switch (score) {
    case 1:
      return { score: 1, label: "Weak", color: "bg-orange-500" };
    case 2:
      return { score: 2, label: "Fair", color: "bg-amber-500" };
    case 3:
      return { score: 3, label: "Good", color: "bg-blue-500" };
    case 4:
    default:
      return { score: 4, label: "Strong", color: "bg-emerald-500" };
  }
}

export async function getCurrentUser(): Promise<User | null> {
  const client = requireSupabase();
  const { data, error } = await client.auth.getUser();
  if (error) {
    // If no active user session, return null without crashing
    return null;
  }
  return data.user;
}

export async function signUpWithEmail(email: string, password: string) {
  const client = requireSupabase();
  const redirectTo = typeof window !== "undefined" ? `${window.location.origin}/settings` : undefined;

  const { data, error } = await client.auth.signUp({
    email: email.trim(),
    password,
    options: {
      emailRedirectTo: redirectTo,
    },
  });

  if (error) throw error;
  return data;
}

export async function resendConfirmationEmail(email: string) {
  const client = requireSupabase();
  const redirectTo = typeof window !== "undefined" ? `${window.location.origin}/settings` : undefined;

  const { data, error } = await client.auth.resend({
    type: "signup",
    email: email.trim(),
    options: {
      emailRedirectTo: redirectTo,
    },
  });

  if (error) throw error;
  return data;
}

export async function signInWithEmail(email: string, password: string) {
  const client = requireSupabase();
  const { data, error } = await client.auth.signInWithPassword({
    email: email.trim(),
    password,
  });

  if (error) throw error;
  return data;
}

export async function resetPasswordForEmail(email: string) {
  const client = requireSupabase();
  const redirectTo = typeof window !== "undefined" ? `${window.location.origin}/settings` : undefined;

  const { data, error } = await client.auth.resetPasswordForEmail(email.trim(), {
    redirectTo,
  });

  if (error) throw error;
  return data;
}

export async function updateUserPassword(newPassword: string) {
  const client = requireSupabase();
  const { data, error } = await client.auth.updateUser({
    password: newPassword,
  });

  if (error) throw error;
  return data;
}

export async function signOut() {
  const client = requireSupabase();
  const { error } = await client.auth.signOut();
  if (error) throw error;
}
