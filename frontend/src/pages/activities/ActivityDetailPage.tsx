import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { routes } from '../../config/member-management';
import { api } from '../../lib/api';
import { ActivityYoutubeEmbed } from '../../components/ActivityYoutubeEmbed';
import { activityDifficultyLabel } from '../../lib/activity-difficulty';
import { useAuth } from '../../context/AuthContext';

type Detail = {
  id: number;
  title: string;
  description: string | null;
  difficulty_level: string;
  category: { id: number; name: string } | null;
  videos: { id: number; url: string }[];
  trainers: {
    member_id: number;
    first_name: string | null;
    last_name: string | null;
    username: string | null;
  }[];
};

function trainerLabel(t: Detail['trainers'][0]): string {
  const n = [t.first_name, t.last_name].filter(Boolean).join(' ').trim();
  return n || t.username || `ID ${t.member_id}`;
}

export function ActivityDetailPage() {
  const { id: idParam } = useParams();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState<Detail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) navigate('/login', { replace: true });
  }, [loading, user, navigate]);

  useEffect(() => {
    if (!user || !idParam) return;
    const id = parseInt(idParam, 10);
    if (Number.isNaN(id)) {
      setError('Identificador no válido.');
      return;
    }
    api
      .get<Detail>(`/activities/${id}`)
      .then(({ data: d }) => {
        setData(d);
        setError(null);
      })
      .catch(() => setError('No se pudo cargar el ejercicio.'));
  }, [user, idParam]);

  if (loading || !user) {
    return (
      <div className="mm-page">
        <p className="muted">Cargando…</p>
      </div>
    );
  }

  return (
    <div className="mm-page pay-manual-page">
      <header className="pay-manual-head">
        <div className="pay-manual-title-row">
          <h1>{data?.title ?? 'Actividad'}</h1>
          <span className="muted pay-manual-crumb">
            {data?.category?.name ?? 'Ejercicios'}
          </span>
        </div>
        <div className="pay-manual-head-actions">
          {data ? (
            <Link
              to={routes.ejerciciosEdit(data.id)}
              className="btn-outline pay-manual-list-btn"
            >
              Editar
            </Link>
          ) : null}
          <Link to={routes.ejercicios} className="btn-outline pay-manual-list-btn">
            Lista de ejercicios
          </Link>
        </div>
      </header>

      {error ? <p className="login-error">{error}</p> : null}

      {data ? (
        <div className="activity-detail">
          <section className="activity-detail-block">
            <h2>Nivel (dificultad)</h2>
            <p className="activity-detail-desc">
              {activityDifficultyLabel(data.difficulty_level)}
            </p>
          </section>

          <section className="activity-detail-block">
            <h2>Descripción</h2>
            <p className="activity-detail-desc">
              {data.description?.trim()
                ? data.description
                : 'Sin descripción.'}
            </p>
          </section>

          <section className="activity-detail-block">
            <h2>Entrenadores</h2>
            <ul className="activity-detail-list">
              {data.trainers.map((t) => (
                <li key={t.member_id}>{trainerLabel(t)}</li>
              ))}
            </ul>
          </section>

          <section className="activity-detail-block">
            <h2>Vídeos</h2>
            <p className="muted small">
              Se incrustan en la página; no se almacenan archivos en el servidor.
            </p>
            {data.videos.length === 0 ? (
              <p className="muted">Sin enlaces.</p>
            ) : (
              <div className="activity-video-grid">
                {data.videos.map((v) => (
                  <div key={v.id} className="activity-video-card">
                    <ActivityYoutubeEmbed
                      url={v.url}
                      iframeTitle={`${data.title} — vídeo`}
                    />
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      ) : null}
    </div>
  );
}
