import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../../lib/api';
import { isPortalPreviewRole } from '../../lib/member-wellness-params';
import { useAuth } from '../../context/AuthContext';

type MembersPayload = {
  members: Array<{
    id: number;
    first_name: string | null;
    last_name: string | null;
  }>;
};

function personLabel(
  m: { first_name?: string | null; last_name?: string | null } | undefined,
  id: number,
): string {
  const parts = [m?.first_name, m?.last_name].filter(Boolean).join(' ').trim();
  if (parts) return parts;
  return `ID ${id}`;
}

export function MemberSocioPreviewBar() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [members, setMembers] = useState<MembersPayload['members']>([]);
  const [search, setSearch] = useState('');
  const [loadErr, setLoadErr] = useState<string | null>(null);

  const role = user?.role_name?.trim().toLowerCase() ?? '';
  const show = isPortalPreviewRole(user?.role_name);

  const selectedIdRaw = searchParams.get('miembro');
  const selectedId =
    selectedIdRaw != null && selectedIdRaw !== ''
      ? parseInt(selectedIdRaw, 10)
      : NaN;
  const selectedValid = Number.isFinite(selectedId) && selectedId > 0;

  useEffect(() => {
    if (!show || !user) return;
    api
      .get<MembersPayload>('/members')
      .then(({ data }) => {
        setMembers(data.members ?? []);
        setLoadErr(null);
      })
      .catch(() => setLoadErr('No se pudo cargar el listado de socios.'));
  }, [show, user]);

  const byId = useMemo(() => {
    const m = new Map<number, MembersPayload['members'][0]>();
    for (const x of members) m.set(x.id, x);
    return m;
  }, [members]);

  const suggestions = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return [];
    return members
      .filter((m) => {
        const blob = [m.first_name, m.last_name, String(m.id)]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return blob.includes(q);
      })
      .slice(0, 12);
  }, [members, search]);

  if (!show) return null;

  function pickMember(id: number) {
    const next = new URLSearchParams(searchParams);
    next.set('miembro', String(id));
    setSearchParams(next, { replace: true });
    setSearch('');
  }

  function clearPick() {
    const next = new URLSearchParams(searchParams);
    next.delete('miembro');
    setSearchParams(next, { replace: true });
  }

  return (
    <div className="mp-portal-preview" role="region" aria-label="Vista como socio">
      <div className="mp-portal-preview-row">
        <span className="mp-portal-preview-label">
          Vista de socio (nutrición y ejercicio)
        </span>
        {selectedValid ? (
          <span className="mp-portal-preview-current">
            {personLabel(byId.get(selectedId), selectedId)}
            <button type="button" className="btn-outline mp-portal-preview-clear" onClick={clearPick}>
              Quitar filtro
            </button>
          </span>
        ) : (
          <span className="muted mp-portal-preview-hint">
            Busca y elige un socio para ver su dieta y rutina semanal como en el portal.
          </span>
        )}
      </div>
      {loadErr ? <p className="login-error mp-portal-preview-err">{loadErr}</p> : null}
      <div className="mp-portal-preview-search">
        <label className="mp-portal-preview-field">
          <input
            type="search"
            className="mp-portal-preview-input"
            placeholder="Buscar socio (nombre, apellidos o ID)…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoComplete="off"
            aria-label="Buscar socio"
          />
        </label>
        {suggestions.length > 0 ? (
          <ul className="mp-portal-preview-suggest" role="listbox">
            {suggestions.map((m) => (
              <li key={m.id}>
                <button type="button" className="mp-portal-preview-suggest-btn" onClick={() => pickMember(m.id)}>
                  {personLabel(m, m.id)}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
      {role === 'staff_member' ? (
        <p className="muted mp-portal-preview-foot">
          Solo aparecen socios que tu cuenta puede gestionar (misma regla que en gestión).
        </p>
      ) : null}
    </div>
  );
}
