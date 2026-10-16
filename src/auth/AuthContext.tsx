import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import { authApi } from "../api/client";

type AuthUser = Record<string, unknown>;

interface RestoredSession {
  accessToken: string;
  user: AuthUser;
}

interface AuthContextType {
  accessToken: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
  isInitializing: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

interface AuthProviderProps {
  children: ReactNode;
}

/*
 * Share the initial restoration operation across component
 * effect re-runs, including React Strict Mode in development.
 */
let sessionRestorePromise: Promise<RestoredSession | null> | null = null;

function restoreSessionOnce(): Promise<RestoredSession | null> {
  if (!sessionRestorePromise) {
    sessionRestorePromise = (async () => {
      try {
        const tokenResponse = await authApi.refresh();

        const user = await authApi.me(tokenResponse.access_token);

        return {
          accessToken: tokenResponse.access_token,
          user,
        };
      } catch {
        // No valid session, or the session could not be restored.
        return null;
      }
    })();
  }

  return sessionRestorePromise;
}

const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

export function AuthProvider({ children }: AuthProviderProps) {
  const [accessToken, setAccessToken] = useState<string | null>(null);

  const [user, setUser] = useState<AuthUser | null>(null);

  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    let active = true;

    restoreSessionOnce()
      .then((session) => {
        if (!active) {
          return;
        }

        if (session) {
          setAccessToken(session.accessToken);
          setUser(session.user);
        }
      })
      .finally(() => {
        if (active) {
          setIsInitializing(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  async function login(
    email: string,
    password: string
  ): Promise<void> {
    const tokenResponse = await authApi.login({
      email,
      password,
    });

    const currentUser = await authApi.me(
      tokenResponse.access_token
    );

    // A new login establishes a new session.
    sessionRestorePromise = null;

    setAccessToken(tokenResponse.access_token);
    setUser(currentUser);
  }

  async function logout(): Promise<void> {
    try {
      await authApi.logout();
    } finally {
      // Always clear local authentication state.
      sessionRestorePromise = null;

      setAccessToken(null);
      setUser(null);
    }
  }

  const value: AuthContextType = {
    accessToken,
    user,
    isAuthenticated: accessToken !== null,
    isInitializing,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error(
      "useAuth must be used within an AuthProvider"
    );
  }

  return context;
}