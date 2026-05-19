import { type FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { MmSelect } from '../../components/ui/MmSelect';
import { routes } from '../../config/member-management';
import { memberPortalRoutes } from '../../config/member-portal';
import { api } from '../../lib/api';
import { extractApiMessage } from '../../lib/extract-api-message';
import {
  ACTIVITY_DIFFICULTY_LEVELS,
  activityDifficultyLabel,
  type ActivityDifficultyLevel,
} from '../../lib/activity-difficulty';
import { useAuth } from '../../context/AuthContext';

type Mode = 'create' | 'edit';

type Category = { id: number; name: string };

type StaffRow = {
  id: number;
  first_name: string | null;
  last_name: string | null;
  username: string | null;
};

function staffLabel(s: StaffRow): string {
  const n = [s.first_name, s.last_name].filter(Boolean).join(' ').trim();
  return n || s.username || `ID ${s.id}`;
}

export function ActivityFormPage({ mode }: { mode: Mode }) {
  const { id: idParam } = useParams();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loadingData, setLoadingData] = useState(mode === 'edit');

  const [categories, setCategories] = useState<Category[]>([]);
  const [staffList, setStaffList] = useState<StaffRow[]>([]);

  const [categoryId, setCategoryId] = useState('');
  const [title, setTitle] = useState('');
  const [difficultyLevel, setDifficultyLevel] =
    useState<ActivityDifficultyLevel>('media');
  const [description, setDescription] = useState('');
  const [videoUrls, setVideoUrls] = useState<string[]>(['']);
  const [trainerIds, setTrainerIds] = useState<number[]>([]);

  const [newCatName, setNewCatName] = useState('');
  const [showNewCat, setShowNewCat] = useState(false);
  const [pickStaffId, setPickStaffId] = useState('');

  useEffect(() => {
    if (!loading && !user) navigate('/login', { replace: true });
  }, [loading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    const r = user.role_name?.trim().toLowerCase() ?? '';
    if (r === 'member') {
      navigate(memberPortalRoutes.wellness, { replace: true });
      return;
    }
    api
      .get<Category[]>('/activities/categories')
      .then(({ data }) => setCategories(data))
      .catch(() => setCategories([]));
    api
      .get<{ staff: StaffRow[] }>('/staff')
      .then(({ data }) => setStaffList(data.staff ?? []))
      .catch(() => setStaffList([]));
  }, [user, navigate]);

  useEffect(() => {
    if (!user || mode !== 'edit' || !idParam) return;
    const id = parseInt(idParam, 10);
    if (Number.isNaN(id)) {
      setLoadingData(false);
      setError('Identificador no válido.');
      return;
    }
    setLoadingData(true);
    api
      .get<{
        id: number;
        category_id: number;
        title: string;
        difficulty_level: string;
        description: string | null;
        videos: { url: string }[];
        trainers: { member_id: number }[];
      }>(`/activities/${id}`)
      .then(({ data: d }) => {
        setCategoryId(String(d.category_id));
        setTitle(d.title);
        const dl = d.difficulty_level?.trim().toLowerCase();
        setDifficultyLevel(
          dl === 'baja' || dl === 'media' || dl === 'alta' ? dl : 'media',
        );
        setDescription(d.description ?? '');
        const vids = d.videos?.length ? d.videos.map((x) => x.url) : [''];
        setVideoUrls(vids);
        setTrainerIds((d.trainers ?? []).map((t) => t.member_id));
        setError(null);
      })
      .catch(() => setError('No se pudo cargar el ejercicio.'))
      .finally(() => setLoadingData(false));
  }, [mode, idParam, user]);

  async function submitNewCategory() {
    const n = newCatName.trim();
    if (!n) {
      setError('Escribe el nombre de la categoría.');
      return;
    }
    try {
      const { data } = await api.post<Category>('/activities/categories', {
        name: n,
      });
      setCategories((c) => [...c, data].sort((a, b) => a.name.localeCompare(b.name)));
      setCategoryId(String(data.id));
      setNewCatName('');
      setShowNewCat(false);
      setError(null);
    } catch (e) {
      setError(extractApiMessage(e) || 'No se pudo crear la categoría.');
    }
  }

  function addTrainer() {
    const id = parseInt(pickStaffId, 10);
    if (Number.isNaN(id)) {
      setError('Selecciona un miembro del personal.');
      return;
    }
    if (trainerIds.includes(id)) {
      setError('Ese entrenador ya está asignado.');
      return;
    }
    setTrainerIds((t) => [...t, id]);
    setPickStaffId('');
    setError(null);
  }

  function removeTrainer(id: number) {
    setTrainerIds((t) => t.filter((x) => x !== id));
  }

  function addVideoRow() {
    setVideoUrls((v) => [...v, '']);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const cat = parseInt(categoryId, 10);
    if (Number.isNaN(cat) || cat < 1) {
      setError('Selecciona una categoría.');
      return;
    }
    const titleTrim = title.trim();
    if (!titleTrim) {
      setError('Indica el título del ejercicio.');
      return;
    }
    if (trainerIds.length === 0) {
      setError('Asigna al menos un entrenador.');
      return;
    }
    const urls = videoUrls.map((s) => s.trim()).filter(Boolean);

    const body = {
      category_id: cat,
      title: titleTrim,
      difficulty_level: difficultyLevel,
      description: description.trim() || undefined,
      video_urls: urls,
      trainer_member_ids: trainerIds,
    };

    setSaving(true);
    try {
      if (mode === 'create') {
        await api.post('/activities', body);
      } else {
        const id = parseInt(idParam ?? '', 10);
        if (Number.isNaN(id)) {
          setError('Identificador no válido.');
          return;
        }
        await api.patch(`/activities/${id}`, body);
      }
      navigate(routes.ejercicios, { replace: true });
    } catch (err: unknown) {
      setError(extractApiMessage(err) || 'No se pudo guardar.');
    } finally {
      setSaving(false);
    }
  }

  if (loading || !user) {
    return (
      <div className="mm-page">
        <p className="muted">Cargando…</p>
      </div>
    );
  }

  if (mode === 'edit' && loadingData) {
    return (
      <div className="mm-page">
        <p className="muted">Cargando ejercicio…</p>
      </div>
    );
  }

  const pageTitle = mode === 'create' ? 'Añadir ejercicio' : 'Editar ejercicio';

  return (
    <div className="mm-page pay-manual-page">
      <header className="pay-manual-head">
        <div className="pay-manual-title-row">
          <h1>{pageTitle}</h1>
          <span className="muted pay-manual-crumb">Ejercicios</span>
        </div>
        <Link to={routes.ejercicios} className="btn-outline pay-manual-list-btn">
          Lista de ejercicios
        </Link>
      </header>

      {error ? <p className="login-error">{error}</p> : null}

      <form className="pay-manual-form" onSubmit={(e) => void onSubmit(e)}>
        <div className="pay-manual-fields">
          <div className="activity-cat-row">
            <label className="pay-manual-label-block">
              <span className="pay-manual-label">
                Selecciona una categoría <span className="pay-req">*</span>
              </span>
              <MmSelect
                required
                value={categoryId}
                onValueChange={setCategoryId}
                options={categories.map((c) => ({
                  value: String(c.id),
                  label: c.name,
                }))}
                placeholder="— selecciona —"
              />
            </label>
            <button
              type="button"
              className="btn-outline"
              onClick={() => setShowNewCat((v) => !v)}
            >
              Añadir categoría
            </button>
          </div>

          {showNewCat ? (
            <div className="pay-manual-row activity-inline-cat">
              <input
                placeholder="Nombre de la nueva categoría"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                maxLength={200}
              />
              <button
                type="button"
                className="btn-primary"
                onClick={() => void submitNewCategory()}
              >
                Guardar categoría
              </button>
            </div>
          ) : null}

          <label className="pay-manual-row">
            <span className="pay-manual-label">
              Título del ejercicio <span className="pay-req">*</span>
            </span>
            <input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
            />
          </label>

          <label className="pay-manual-row">
            <span className="pay-manual-label">
              Nivel (dificultad) <span className="pay-req">*</span>
            </span>
            <MmSelect
              required
              value={difficultyLevel}
              onValueChange={(v) =>
                setDifficultyLevel(v as ActivityDifficultyLevel)
              }
              options={ACTIVITY_DIFFICULTY_LEVELS.map((v) => ({
                value: v,
                label: activityDifficultyLabel(v),
              }))}
            />
          </label>

          <label className="pay-manual-row">
            <span className="pay-manual-label">Descripción</span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="Instrucciones, series, material…"
            />
          </label>

          <div className="activity-staff-row">
            <label className="pay-manual-label-block">
              <span className="pay-manual-label">
                Asignar a miembro del personal <span className="pay-req">*</span>
              </span>
              <MmSelect
                value={pickStaffId}
                onValueChange={setPickStaffId}
                options={staffList.map((s) => ({
                  value: String(s.id),
                  label: staffLabel(s),
                }))}
                placeholder="— Seleccione miembro del personal —"
              />
            </label>
            <button type="button" className="btn-outline" onClick={addTrainer}>
              Agregar miembro del personal
            </button>
          </div>

          {trainerIds.length > 0 ? (
            <ul className="activity-trainer-chips">
              {trainerIds.map((tid) => {
                const s = staffList.find((x) => x.id === tid);
                return (
                  <li key={tid} className="activity-trainer-chip">
                    <span>{s ? staffLabel(s) : `ID ${tid}`}</span>
                    <button
                      type="button"
                      className="btn-table btn-table--danger"
                      onClick={() => removeTrainer(tid)}
                    >
                      Borrar
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="muted small">Ningún entrenador asignado aún.</p>
          )}

          <div className="activity-videos-block">
            <span className="pay-manual-label">
              Enlaces a YouTube (solo URL; no se suben archivos)
            </span>
            {videoUrls.map((line, i) => (
              <input
                key={i}
                className="activity-video-input"
                type="url"
                placeholder="https://www.youtube.com/watch?v=…"
                value={line}
                onChange={(e) =>
                  setVideoUrls((rows) =>
                    rows.map((v, j) => (j === i ? e.target.value : v)),
                  )
                }
              />
            ))}
            <button type="button" className="btn-outline" onClick={addVideoRow}>
              Añadir más
            </button>
          </div>
        </div>

        <div className="pay-manual-actions">
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'Guardando…' : 'Guardar ejercicio'}
          </button>
        </div>
      </form>
    </div>
  );
}
