import { useCallback, useEffect, useMemo, useState } from "react";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { AuthContext } from "@/context/authContextValue";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const signOut = useCallback(() => supabase.auth.signOut(), []);

  useEffect(() => {
    let mounted = true;

    if (!isSupabaseConfigured) {
      setError("Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your local environment.");
      setLoading(false);
      return () => { mounted = false; };
    }

    async function restoreSession() {
      const { data, error: sessionError } = await supabase.auth.getSession();
      if (!mounted) return;
      if (sessionError) setError("We could not restore your session. Please sign in again.");
      setUser(data.session?.user ?? null);
      setLoading(false);
    }

    restoreSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      setUser(session?.user ?? null);
      setError("");
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const value = useMemo(() => ({ user, loading, error, signOut }), [error, loading, signOut, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}