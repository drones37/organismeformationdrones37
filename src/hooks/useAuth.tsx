import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

const ADMIN_PASSWORD = "Formation2026!";
const LOCAL_AUTH_KEY = "drones37_local_auth";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const makeFakeSession = (email: string): Session => {
  const user = {
    id: "local-admin",
    email,
    aud: "authenticated",
    role: "authenticated",
    app_metadata: {},
    user_metadata: {},
    created_at: new Date().toISOString(),
  } as unknown as User;
  return {
    access_token: "local",
    refresh_token: "local",
    expires_in: 3600 * 24 * 365,
    expires_at: Math.floor(Date.now() / 1000) + 3600 * 24 * 365,
    token_type: "bearer",
    user,
  } as Session;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(LOCAL_AUTH_KEY);
      if (stored) {
        const s = JSON.parse(stored) as Session;
        setSession(s);
        setUser(s.user);
      }
    } catch {
      // ignore
    }
    setLoading(false);
  }, []);

  const signIn = async (email: string, password: string) => {
    if (password !== ADMIN_PASSWORD) {
      return { error: new Error("Mot de passe incorrect") };
    }
    const s = makeFakeSession(email || "admin@drones37.fr");
    localStorage.setItem(LOCAL_AUTH_KEY, JSON.stringify(s));
    setSession(s);
    setUser(s.user);
    return { error: null };
  };

  const signOut = async () => {
    localStorage.removeItem(LOCAL_AUTH_KEY);
    setSession(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ session, user, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
