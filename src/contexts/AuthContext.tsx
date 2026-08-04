import {
  createContext,
  type PropsWithChildren,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { AppState } from "react-native";
import {
  type AuthSession,
  type AuthUser,
  refreshSession,
  restoreSession,
  signInWithPassword,
  signOutSession,
  signUpWithPassword,
  type SignUpResult,
} from "../lib/supabaseAuth";

type AuthContextValue = {
  session: AuthSession | null;
  user: AuthUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (
    fullName: string,
    email: string,
    password: string
  ) => Promise<SignUpResult>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function initializeSession() {
      const nextSession = await restoreSession();

      if (mounted) {
        setSession(nextSession);
        setLoading(false);
      }
    }

    void initializeSession();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", async (state) => {
      if (state !== "active" || !session?.refresh_token) {
        return;
      }

      try {
        const nextSession = await refreshSession(session.refresh_token);
        setSession(nextSession);
      } catch {
        const nextSession = await restoreSession();
        setSession(nextSession);
      }
    });

    return () => subscription.remove();
  }, [session?.refresh_token]);

  async function signIn(email: string, password: string) {
    const nextSession = await signInWithPassword(email, password);
    setSession(nextSession);
  }

  async function signUp(
    fullName: string,
    email: string,
    password: string
  ) {
    const result = await signUpWithPassword(fullName, email, password);

    if (result.session) {
      setSession(result.session);
    }

    return result;
  }

  async function signOut() {
    const accessToken = session?.access_token;
    await signOutSession(accessToken);
    setSession(null);
  }

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      loading,
      signIn,
      signUp,
      signOut,
    }),
    [loading, session]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider.");
  }

  return context;
}
