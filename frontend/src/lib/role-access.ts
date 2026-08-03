/** Capacidades por rol y especialización en el módulo de gestión (alineado con API). */

import { routes } from '../config/member-management';

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

export type StaffSpecialization = { id: number; name: string };

function normalizeSpecName(name: string): string {
  return name.trim().toLowerCase();
}

/** Prefijos de ruta de gestión concedidos por una especialización (por nombre). */
function prefixesForSpecName(name: string): string[] {
  const n = normalizeSpecName(name);
  if (n === 'entrenador') {
    return ['/gestion/ejercicios', '/gestion/rutinas'];
  }
  if (n === 'nutricionista') {
    return ['/gestion/nutricion'];
  }
  if (n === 'cajero') {
    return [
      '/gestion/socios',
      '/gestion/punto-venta',
      '/gestion/control-acceso',
    ];
  }
  if (n === 'stock') {
    return ['/gestion/punto-venta/stock'];
  }
  return [];
}

/** Unión de prefijos de gestión según especializaciones del staff. */
export function staffModulesFromSpecs(
  specs: StaffSpecialization[],
): string[] {
  const set = new Set<string>();
  for (const s of specs) {
    for (const p of prefixesForSpecName(s.name)) {
      set.add(p);
    }
  }
  return [...set];
}

const STAFF_DEFAULT_PREFIX_ORDER = [
  '/gestion/rutinas',
  '/gestion/ejercicios',
  '/gestion/nutricion',
  '/gestion/socios',
  '/gestion/punto-venta/stock',
  '/gestion/punto-venta',
  '/gestion/control-acceso',
] as const;

function defaultPathForPrefix(prefix: string): string {
  if (prefix === '/gestion/rutinas') return routes.rutinas;
  if (prefix === '/gestion/ejercicios') return routes.ejercicios;
  if (prefix === '/gestion/nutricion') return routes.nutricion;
  if (prefix === '/gestion/socios') return routes.socios;
  if (prefix === '/gestion/punto-venta/stock') return routes.puntoVentaStock;
  if (prefix === '/gestion/punto-venta') return routes.puntoVentaVender;
  if (prefix === '/gestion/control-acceso') return routes.controlAccesoRegistro;
  return prefix;
}

/** Primera ruta de gestión disponible para el staff según sus especializaciones. */
export function staffDefaultRoute(specs: StaffSpecialization[]): string {
  const modules = staffModulesFromSpecs(specs);
  for (const prefix of STAFF_DEFAULT_PREFIX_ORDER) {
    if (modules.includes(prefix)) {
      return defaultPathForPrefix(prefix);
    }
  }
  return routes.rutinasAsignaciones;
}

export function canStaffAccessGestionPath(
  pathname: string,
  specs: StaffSpecialization[],
): boolean {
  const modules = staffModulesFromSpecs(specs);
  if (modules.length === 0) {
    return pathname.startsWith('/gestion/rutinas');
  }
  return modules.some((p) => pathname.startsWith(p));
}

export function staffHasModule(
  specs: StaffSpecialization[],
  prefix: string,
): boolean {
  return staffModulesFromSpecs(specs).includes(prefix);
}

export function gestionHomeForRole(
  role: string | null | undefined,
  specs: StaffSpecialization[] = [],
): string {
  if (isStaff(role)) {
    return staffDefaultRoute(specs);
  }
  return routes.dashboard;
}
