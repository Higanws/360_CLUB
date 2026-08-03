/**
 * Código público de socio (`gym_member.member_id`), alineado con el alta nativa.
 * Formato: M{id}{dd}{yy} — ej. id 5 el 3-ago-2026 → M50326.
 */
export function formatMemberCode(
  id: number,
  at: Date = new Date(),
): string {
  const dd = String(at.getDate()).padStart(2, '0');
  const yy = String(at.getFullYear()).slice(-2);
  return `M${id}${dd}${yy}`;
}
