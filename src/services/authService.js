import { supabase } from "@/lib/supabase";

export function registerUser({ email, password, fullName, pharmacyName }) {
  return supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        pharmacy_name: pharmacyName || "My Pharmacy",
      },
      emailRedirectTo: `${window.location.origin}/login`,
    },
  });
}

export function loginUser(email, password) {
  return supabase.auth.signInWithPassword({ email, password });
}

export function logoutUser() {
  return supabase.auth.signOut();
}

export function sendPasswordReset(email) {
  return supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });
}

export function updatePassword(password) {
  return supabase.auth.updateUser({ password });
}