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
  resendVerification as resendVerificationRequest,
  restoreSession,
  saveUser,
  signIn as signInRequest,
  signOut as signOutRequest,
  verifyEmail as verifyEmailRequest,
} from "@/lib/auth/session";

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<AuthUser>;
  register: (username: string, email: string, password: string) => Promise<string>;
  verifyEmail: (email: string, code: string) => Promise<AuthUser>;
  resendVerification: (email: string) => Promise<string>;
  signOut: () => Promise<void>;
  updateUser: (next: AuthUser) => Promise<void>;
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
    (username: string, email: string, password: string) =>
      registerRequest({ username, email, password }),
    [],
  );

  const verifyEmail = useCallback(async (email: string, code: string) => {
    const nextUser = await verifyEmailRequest(email, code);
    setUser(nextUser);
    return nextUser;
  }, []);

  const resendVerification = useCallback(
    (email: string) => resendVerificationRequest(email),
    [],
  );

  const signOut = useCallback(async () => {
    await signOutRequest();
    setUser(null);
  }, []);

  const updateUser = useCallback(async (next: AuthUser) => {
    setUser(next);
    await saveUser(next);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signIn,
        register,
        verifyEmail,
        resendVerification,
        signOut,
        updateUser,
      }}>
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
