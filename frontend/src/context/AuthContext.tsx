import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { api, SESSION_EXPIRED_EVENT, setAuthHeader } from '../lib/api';
import { isBusinessUser } from '../lib/role-access';

const STORAGE_ACCESS = 'club360_access';
const STORAGE_REFRESH = 'club360_refresh';

export type UserProfile = {
  id: number;
  username: string | null;
  role_name: string | null;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  specialization_ids?: number[];
  specializations?: { id: number; name: string }[];
};

/** Sesión socio: por pestaña. Admin/staff: localStorage compartido entre pestañas. */
function readRawTokens(): { access: string | null; refresh: string | null } {
  const sa = sessionStorage.getItem(STORAGE_ACCESS);
  const sr = sessionStorage.getItem(STORAGE_REFRESH);
  if (sa || sr) {
    return { access: sa, refresh: sr };
  }
  const la = localStorage.getItem(STORAGE_ACCESS);
  const lr = localStorage.getItem(STORAGE_REFRESH);
  return { access: la, refresh: lr };
}

function persistTokens(
  access: string,
  refresh: string,
  roleName: string | null | undefined,
): void {
  if (isBusinessUser(roleName)) {
    sessionStorage.removeItem(STORAGE_ACCESS);
    sessionStorage.removeItem(STORAGE_REFRESH);
    localStorage.setItem(STORAGE_ACCESS, access);
    localStorage.setItem(STORAGE_REFRESH, refresh);
  } else {
    localStorage.removeItem(STORAGE_ACCESS);
    localStorage.removeItem(STORAGE_REFRESH);
    sessionStorage.setItem(STORAGE_ACCESS, access);
    sessionStorage.setItem(STORAGE_REFRESH, refresh);
  }
}

/** Tras login o /me: dejar tokens en el almacén que corresponde al rol (migra legado en local). */
function alignTokensWithRole(
  user: UserProfile,
  access: string,
  refresh: string,
): void {
  if (!refresh) return;
  persistTokens(access, refresh, user.role_name);
}

function clearStoredTokens(): void {
  localStorage.removeItem(STORAGE_ACCESS);
  localStorage.removeItem(STORAGE_REFRESH);
  sessionStorage.removeItem(STORAGE_ACCESS);
  sessionStorage.removeItem(STORAGE_REFRESH);
}

/** Esta pestaña tiene sesión de portal (socio); no aplicar cambios de localStorage desde otras pestañas. */
function tabHasMemberSession(): boolean {
  return Boolean(
    sessionStorage.getItem(STORAGE_ACCESS) ||
      sessionStorage.getItem(STORAGE_REFRESH),
  );
}

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
  const [accessToken, setAccessToken] = useState<string | null>(() => {
    const { access } = readRawTokens();
    return access;
  });
  const [refreshToken, setRefreshToken] = useState<string | null>(() => {
    const { refresh } = readRawTokens();
    return refresh;
  });
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
    const { access, refresh } = readRawTokens();
    if (!access && !refresh) {
      setLoading(false);
      return;
    }

    const applyRefresh = async (rt: string) => {
      const { data } = await api.post<{
        accessToken: string;
        refreshToken: string;
      }>('/auth/refresh', { refreshToken: rt });
      setAuthHeader(data.accessToken);
      const me = await api.get<UserProfile>('/auth/me');
      alignTokensWithRole(me.data, data.accessToken, data.refreshToken);
      setUser(me.data);
      setAccessToken(data.accessToken);
      setRefreshToken(data.refreshToken);
    };

    try {
      if (access) {
        setAuthHeader(access);
        try {
          const { data } = await api.get<UserProfile>('/auth/me');
          if (refresh) alignTokensWithRole(data, access, refresh);
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

  /** Sincronizar admin/staff cuando otra pestaña escribe o renueva tokens en localStorage. */
  const syncFromOtherTabLocalStorage = useCallback(async () => {
    if (tabHasMemberSession()) return;

    const access = localStorage.getItem(STORAGE_ACCESS);
    const refresh = localStorage.getItem(STORAGE_REFRESH);
    if (!access && !refresh) {
      setAuthHeader(null);
      setAccessToken(null);
      setRefreshToken(null);
      setUser(null);
      return;
    }

    const applyRefresh = async (rt: string) => {
      const { data } = await api.post<{
        accessToken: string;
        refreshToken: string;
      }>('/auth/refresh', { refreshToken: rt });
      setAuthHeader(data.accessToken);
      const me = await api.get<UserProfile>('/auth/me');
      if (!isBusinessUser(me.data.role_name)) {
        return;
      }
      alignTokensWithRole(me.data, data.accessToken, data.refreshToken);
      setUser(me.data);
      setAccessToken(data.accessToken);
      setRefreshToken(data.refreshToken);
    };

    try {
      if (access) {
        setAuthHeader(access);
        try {
          const { data } = await api.get<UserProfile>('/auth/me');
          if (!isBusinessUser(data.role_name)) {
            return;
          }
          if (refresh) alignTokensWithRole(data, access, refresh);
          setUser(data);
          setAccessToken(access);
          setRefreshToken(refresh);
        } catch {
          if (refresh) await applyRefresh(refresh);
        }
      } else if (refresh) {
        await applyRefresh(refresh);
      }
    } catch {
      /* otro tab pudo escribir tokens inválidos; no cerrar sesión de socio en otra ruta */
    }
  }, []);

  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  useEffect(() => {
    const onExpired = () => logout();
    window.addEventListener(SESSION_EXPIRED_EVENT, onExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, onExpired);
  }, [logout]);

  useEffect(() => {
    let t: ReturnType<typeof setTimeout> | undefined;
    const schedule = () => {
      clearTimeout(t);
      t = setTimeout(() => void syncFromOtherTabLocalStorage(), 40);
    };

    const onStorage = (e: StorageEvent) => {
      if (e.storageArea !== localStorage) return;
      if (e.key !== STORAGE_ACCESS && e.key !== STORAGE_REFRESH) return;
      schedule();
    };
    window.addEventListener('storage', onStorage);
    return () => {
      clearTimeout(t);
      window.removeEventListener('storage', onStorage);
    };
  }, [syncFromOtherTabLocalStorage]);

  const login = useCallback(async (username: string, password: string) => {
    const { data } = await api.post<{
      accessToken: string;
      refreshToken: string;
      user: UserProfile;
    }>('/auth/login', { username, password });

    persistTokens(data.accessToken, data.refreshToken, data.user.role_name);
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
