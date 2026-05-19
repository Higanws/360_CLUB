import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MmCombobox } from '../../components/ui/MmCombobox';
import { fetchAllMembersLiteRows } from '../../lib/members-api';
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
    fetchAllMembersLiteRows(200)
      .then((rows) => {
        setMembers(rows);
        setLoadErr(null);
      })
      .catch(() => setLoadErr('No se pudo cargar el listado de socios.'));
  }, [show, user]);

  const byId = useMemo(() => {
    const m = new Map<number, MembersPayload['members'][0]>();
    for (const x of members) m.set(x.id, x);
    return m;
  }, [members]);

  const comboboxOptions = useMemo(() => {
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
      .slice(0, 12)
      .map((m) => ({
        value: String(m.id),
        label: personLabel(m, m.id),
      }));
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
        <MmCombobox
          query={search}
          onQueryChange={setSearch}
          options={comboboxOptions}
          onSelect={(v) => pickMember(parseInt(v, 10))}
          placeholder="Buscar socio (nombre, apellidos o ID)…"
          emptyMessage="Ningún socio coincide."
          aria-label="Buscar socio"
        />
      </div>
      {role === 'staff_member' ? (
        <p className="muted mp-portal-preview-foot">
          Solo aparecen socios que tu cuenta puede gestionar (misma regla que en gestión).
        </p>
      ) : null}
    </div>
  );
}
