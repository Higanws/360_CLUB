/** Capacidades por rol en el módulo de gestión (alineado con API). */

export function normalizeRole(role: string | null | undefined): string {
  return (role ?? '').trim().toLowerCase();
}

export function isAdministrator(role: string | null | undefined): boolean {
  return normalizeRole(role) === 'administrator';
}

export function isStaff(role: string | null | undefined): boolean {
  return normalizeRole(role) === 'staff_member';
}

export function isBusinessUser(role: string | null | undefined): boolean {
  return isAdministrator(role) || isStaff(role);
}

/** Rutas de gestión permitidas para staff (entrenador). */
export const STAFF_GESTION_PREFIXES = [
  '/gestion/ejercicios',
  '/gestion/rutinas',
  '/gestion/nutricion',
] as const;

export function staffDefaultRoute(): string {
  return '/gestion/rutinas/asignaciones';
}

export function canStaffAccessGestionPath(pathname: string): boolean {
  return STAFF_GESTION_PREFIXES.some((p) => pathname.startsWith(p));
}

export function gestionHomeForRole(role: string | null | undefined): string {
  if (isStaff(role)) {
    return staffDefaultRoute();
  }
  return '/gestion/dashboard';
}
