/** Roles que pueden previsualizar el portal con `?miembro=id`. */
export function isPortalPreviewRole(role: string | undefined | null): boolean {
  const r = role?.trim().toLowerCase() ?? '';
  return r === 'administrator' || r === 'staff_member';
}
