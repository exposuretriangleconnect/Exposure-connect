import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase, type Session } from "../lib/supabase";
import type { Profile, UserCapability, Capability } from "../types";

interface AuthContextValue {
  session: Session | null;
  profile: Profile | null;
  capabilities: Capability[];
  loading: boolean;
  signInWithTokens: (accessToken: string, refreshToken: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  refreshCapabilities: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [capabilities, setCapabilities] = useState<Capability[]>([]);
  const [loading, setLoading] = useState(true);

  const loadProfile = async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();
    if (data) setProfile(data as Profile);
  };

  const loadCapabilities = async (userId: string) => {
    const { data } = await supabase
      .from("user_capabilities")
      .select("capability, enabled")
      .eq("user_id", userId)
      .eq("enabled", true);
    if (data) {
      setCapabilities(
        data
          .filter((c: { enabled: boolean; capability: Capability }) => c.enabled)
          .map((c: { enabled: boolean; capability: Capability }) => c.capability),
      );
    }
  };

  useEffect(() => {
    supabase.auth.onAuthStateChange((_event, newSession) => {
      (async () => {
        setSession(newSession);
        if (newSession?.user) {
          await loadProfile(newSession.user.id);
          await loadCapabilities(newSession.user.id);
        } else {
          setProfile(null);
          setCapabilities([]);
        }
        setLoading(false);
      })();
    });
  }, []);

  const signInWithTokens = async (accessToken: string, refreshToken: string) => {
    const { data, error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
    if (error) throw error;
    setSession(data.session);
    if (data.session?.user) {
      await loadProfile(data.session.user.id);
      await loadCapabilities(data.session.user.id);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setProfile(null);
    setCapabilities([]);
  };

  const refreshProfile = async () => {
    if (session?.user) await loadProfile(session.user.id);
  };

  const refreshCapabilities = async () => {
    if (session?.user) await loadCapabilities(session.user.id);
  };

  return (
    <AuthContext.Provider
      value={{ session, profile, capabilities, loading, signInWithTokens, signOut, refreshProfile, refreshCapabilities }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
