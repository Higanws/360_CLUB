import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MmCombobox } from '../../components/ui/MmCombobox';
import {
  searchMembersLite,
  type MemberLiteRow,
} from '../../lib/members-api';
import { useDebouncedValue } from '../../hooks/useDebouncedValue';
import { isPortalPreviewRole } from '../../lib/member-wellness-params';
import { useAuth } from '../../context/AuthContext';

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
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState<MemberLiteRow[]>([]);
  const [selectedMember, setSelectedMember] = useState<MemberLiteRow | null>(
    null,
  );
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const debouncedSearch = useDebouncedValue(search, 300);

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
    if (selectedValid && selectedMember?.id !== selectedId) {
      searchMembersLite(String(selectedId), 1)
        .then((rows) => {
          const hit = rows.find((m) => m.id === selectedId) ?? rows[0];
          if (hit) setSelectedMember(hit);
        })
        .catch(() => {
          /* etiqueta fallback abajo */
        });
    }
    if (!selectedValid) {
      setSelectedMember(null);
    }
  }, [show, user, selectedValid, selectedId, selectedMember?.id]);

  useEffect(() => {
    if (!show || !user) return;
    const q = debouncedSearch.trim();
    if (q.length < 2) {
      setSearchResults([]);
      return;
    }
    let cancelled = false;
    searchMembersLite(q, 12)
      .then((rows) => {
        if (!cancelled) {
          setSearchResults(rows);
          setLoadErr(null);
        }
      })
      .catch(() => {
        if (!cancelled) setLoadErr('No se pudo buscar socios.');
      });
    return () => {
      cancelled = true;
    };
  }, [debouncedSearch, show, user]);

  const comboboxOptions = useMemo(
    () =>
      searchResults.map((m) => ({
        value: String(m.id),
        label: personLabel(m, m.id),
      })),
    [searchResults],
  );

  if (!show) return null;

  function pickMember(id: number) {
    const hit = searchResults.find((m) => m.id === id);
    if (hit) setSelectedMember(hit);
    const next = new URLSearchParams(searchParams);
    next.set('miembro', String(id));
    setSearchParams(next, { replace: true });
    setSearch('');
    setSearchResults([]);
  }

  function clearPick() {
    setSelectedMember(null);
    const next = new URLSearchParams(searchParams);
    next.delete('miembro');
    setSearchParams(next, { replace: true });
  }

  const displayMember =
    selectedMember ??
    (selectedValid ? { id: selectedId, first_name: null, last_name: null } : null);

  return (
    <div className="mp-portal-preview" role="region" aria-label="Vista como socio">
      <div className="mp-portal-preview-row">
        <span className="mp-portal-preview-label">
          Vista de socio (nutrición y ejercicio)
        </span>
        {selectedValid ? (
          <span className="mp-portal-preview-current">
            {personLabel(displayMember ?? undefined, selectedId)}
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
          placeholder="Buscar socio (mín. 2 caracteres)…"
          emptyMessage={
            search.trim().length < 2
              ? 'Escribe al menos 2 caracteres.'
              : 'Ningún socio coincide.'
          }
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
