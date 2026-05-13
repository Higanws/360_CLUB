import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { api, setAuthHeader } from '../lib/api';

const STORAGE_ACCESS = 'club360_access';
const STORAGE_REFRESH = 'club360_refresh';

/** Tokens en localStorage para compartir sesión entre pestañas (p. ej. portal desde gestión). */
function migrateTokensFromSessionToLocal(): void {
  const a = sessionStorage.getItem(STORAGE_ACCESS);
  const r = sessionStorage.getItem(STORAGE_REFRESH);
  if (a) localStorage.setItem(STORAGE_ACCESS, a);
  if (r) localStorage.setItem(STORAGE_REFRESH, r);
  if (a || r) {
    sessionStorage.removeItem(STORAGE_ACCESS);
    sessionStorage.removeItem(STORAGE_REFRESH);
  }
}

function readToken(key: string): string | null {
  migrateTokensFromSessionToLocal();
  return localStorage.getItem(key);
}

function writeToken(key: string, value: string): void {
  localStorage.setItem(key, value);
  sessionStorage.removeItem(key);
}

function clearStoredTokens(): void {
  localStorage.removeItem(STORAGE_ACCESS);
  localStorage.removeItem(STORAGE_REFRESH);
  sessionStorage.removeItem(STORAGE_ACCESS);
  sessionStorage.removeItem(STORAGE_REFRESH);
}

export type UserProfile = {
  id: number;
  username: string | null;
  role_name: string | null;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
};

type AuthState = {
  accessToken: string | null;
  refreshToken: string | null;
  user: UserProfile | null;
  loading: boolean;
};

type AuthContextValue = AuthState & {
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [accessToken, setAccessToken] = useState<string | null>(() =>
    readToken(STORAGE_ACCESS),
  );
  const [refreshToken, setRefreshToken] = useState<string | null>(() =>
    readToken(STORAGE_REFRESH),
  );
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    clearStoredTokens();
    setAccessToken(null);
    setRefreshToken(null);
    setUser(null);
    setAuthHeader(null);
  }, []);

  const bootstrap = useCallback(async () => {
    const access = readToken(STORAGE_ACCESS);
    const refresh = readToken(STORAGE_REFRESH);
    if (!access && !refresh) {
      setLoading(false);
      return;
    }

    const applyRefresh = async (rt: string) => {
      const { data } = await api.post<{
        accessToken: string;
        refreshToken: string;
      }>('/auth/refresh', { refreshToken: rt });
      writeToken(STORAGE_ACCESS, data.accessToken);
      writeToken(STORAGE_REFRESH, data.refreshToken);
      setAuthHeader(data.accessToken);
      const me = await api.get<UserProfile>('/auth/me');
      setUser(me.data);
      setAccessToken(data.accessToken);
      setRefreshToken(data.refreshToken);
    };

    try {
      if (access) {
        setAuthHeader(access);
        try {
          const { data } = await api.get<UserProfile>('/auth/me');
          setUser(data);
          setAccessToken(access);
          setRefreshToken(refresh);
        } catch {
          if (refresh) await applyRefresh(refresh);
          else logout();
        }
      } else if (refresh) {
        await applyRefresh(refresh);
      }
    } catch {
      logout();
    } finally {
      setLoading(false);
    }
  }, [logout]);

  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  /** Si otra pestaña borra los tokens (cerrar sesión), esta pestaña deja de estar autenticada. */
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.storageArea !== localStorage) return;
      if (e.key !== STORAGE_ACCESS && e.key !== STORAGE_REFRESH) return;
      if (
        !localStorage.getItem(STORAGE_ACCESS) &&
        !localStorage.getItem(STORAGE_REFRESH)
      ) {
        setAuthHeader(null);
        setAccessToken(null);
        setRefreshToken(null);
        setUser(null);
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const { data } = await api.post<{
      accessToken: string;
      refreshToken: string;
      user: UserProfile;
    }>('/auth/login', { username, password });

    writeToken(STORAGE_ACCESS, data.accessToken);
    writeToken(STORAGE_REFRESH, data.refreshToken);
    setAuthHeader(data.accessToken);
    setAccessToken(data.accessToken);
    setRefreshToken(data.refreshToken);
    setUser(data.user);
  }, []);

  const value = useMemo(
    () => ({
      accessToken,
      refreshToken,
      user,
      loading,
      login,
      logout,
    }),
    [accessToken, refreshToken, user, loading, login, logout],
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return ctx;
}
