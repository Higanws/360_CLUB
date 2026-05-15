/** Normaliza carnet / código socio (mayúsculas, sin espacios). */
export function normalizeMemberLookupToken(raw: string): string {
  return raw.trim().toUpperCase().replace(/\s+/g, '');
}
