/** Rutas públicas (sin sesión requerida). */
export const PUBLIC_APP_PATHS = ['/login'] as const;

export function isPublicAppPath(pathname: string): boolean {
  return PUBLIC_APP_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

/** Raíz de la app: no guardamos "from" al redirigir al login. */
export function isAppEntryPath(pathname: string): boolean {
  return pathname === '/' || pathname === '/login';
}

export function buildReturnPath(pathname: string, search = ''): string {
  return `${pathname}${search}`;
}

export function loginRedirectState(pathname: string, search = '') {
  const from = buildReturnPath(pathname, search);
  if (isAppEntryPath(pathname) || isPublicAppPath(pathname)) {
    return undefined;
  }
  return { from };
}

/** Tras login: volver a la URL intentada o al home del rol. */
export function resolvePostLoginPath(from: unknown): string {
  if (typeof from !== 'string' || !from.startsWith('/') || from.startsWith('//')) {
    return '/home';
  }
  if (isAppEntryPath(from.split('?')[0] ?? from) || isPublicAppPath(from.split('?')[0] ?? '')) {
    return '/home';
  }
  return from;
}
