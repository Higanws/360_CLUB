export type ClubRole = 'administrator' | 'staff_member' | 'member' | string;

export type RoleLevel = 'business' | 'administrator';

export function normalizeRole(role_name: string): string {
  return role_name.trim().toLowerCase();
}

export function isAdministrator(role_name: string): boolean {
  return normalizeRole(role_name) === 'administrator';
}

export function isBusinessRole(role_name: string): boolean {
  const r = normalizeRole(role_name);
  return r === 'administrator' || r === 'staff_member';
}

export function permissionsSummary(role_name: string): string {
  if (isAdministrator(role_name)) {
    return 'Administrador: acceso completo (socios, staff, pagos, POS, dashboard, acceso).';
  }
  if (normalizeRole(role_name) === 'staff_member') {
    return 'Staff: socios asignados, nutrición, rutinas, ejercicios. Sin pagos/POS/staff CRUD.';
  }
  return `Rol ${role_name}: acceso limitado.`;
}

export function roleMeetsMin(role_name: string, min: RoleLevel): boolean {
  if (min === 'business') return isBusinessRole(role_name);
  return isAdministrator(role_name);
}
