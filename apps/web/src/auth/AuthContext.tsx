import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from "react";
import {
  login as apiLogin,
  logout as apiLogout,
  refreshSession as apiRefreshSession,
  signUp as apiSignUp,
  type AuthResponse,
  type User
} from "../lib/api";

type AuthContextValue = {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isBootstrapping: boolean;
  login: (input: { email: string; password: string }) => Promise<AuthResponse>;
  signUp: (input: {
    fullName: string;
    email: string;
    password: string;
  }) => Promise<AuthResponse>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<AuthResponse | null>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function applyAuthState(
  data: AuthResponse,
  setUser: (value: User | null) => void,
  setAccessToken: (value: string | null) => void
) {
  setUser(data.user);
  setAccessToken(data.accessToken);
}

function isExpectedBootstrapAuthError(error: unknown) {
  if (!(error instanceof Error)) return false;

  const message = error.message.toLowerCase();

  return (
    message.includes("missing refresh token") ||
    message.includes("invalid refresh token") ||
    message.includes("status 401")
  );
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  const clearAuthState = useCallback(() => {
    setUser(null);
    setAccessToken(null);
  }, []);

  const refreshSession = useCallback(async () => {
    const data = await apiRefreshSession();

    if (!data) {
      clearAuthState();
      return null;
    }

    applyAuthState(data, setUser, setAccessToken);
    return data;
  }, [clearAuthState]);

  const login = useCallback(
    async (input: { email: string; password: string }) => {
      const data = await apiLogin(input);
      applyAuthState(data, setUser, setAccessToken);
      return data;
    },
    []
  );

  const signUp = useCallback(
    async (input: { fullName: string; email: string; password: string }) => {
      const data = await apiSignUp(input);
      applyAuthState(data, setUser, setAccessToken);
      return data;
    },
    []
  );

  const logout = useCallback(async () => {
    try {
      await apiLogout();
    } finally {
      clearAuthState();
    }
  }, [clearAuthState]);

  useEffect(() => {
    let active = true;

    async function bootstrap() {
      try {
        const data = await apiRefreshSession();
        if (!active) return;

        if (!data) {
          clearAuthState();
          return;
        }

        applyAuthState(data, setUser, setAccessToken);
      } catch (error) {
        if (!active) return;
        clearAuthState();

        if (!isExpectedBootstrapAuthError(error)) {
          console.error(error);
        }
      } finally {
        if (active) {
          setIsBootstrapping(false);
        }
      }
    }

    void bootstrap();

    return () => {
      active = false;
    };
  }, [clearAuthState]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      accessToken,
      isAuthenticated: Boolean(user && accessToken),
      isBootstrapping,
      login,
      signUp,
      logout,
      refreshSession
    }),
    [user, accessToken, isBootstrapping, login, signUp, logout, refreshSession]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);

  if (!value) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return value;
}
