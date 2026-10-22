import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import type { AuthUser } from "@/lib/api/types";
import {
  register as registerRequest,
  restoreSession,
  signIn as signInRequest,
  signOut as signOutRequest,
} from "@/lib/auth/session";

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<AuthUser>;
  register: (username: string, email: string, password: string) => Promise<AuthUser>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    restoreSession()
      .then((restored) => {
        if (!cancelled) setUser(restored);
      })
      .catch(() => {
        if (!cancelled) setUser(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const nextUser = await signInRequest(email, password);
    setUser(nextUser);
    return nextUser;
  }, []);

  const register = useCallback(
    async (username: string, email: string, password: string) => {
      const nextUser = await registerRequest({ username, email, password });
      setUser(nextUser);
      return nextUser;
    },
    [],
  );

  const signOut = useCallback(async () => {
    await signOutRequest();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, signIn, register, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return value;
}
