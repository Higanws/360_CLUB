import { lazy, Suspense, type ReactNode } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AppRootRedirect } from './components/auth/AppRootRedirect';
import { AuthCatchAll } from './components/auth/AuthCatchAll';
import { RequireAuthOutlet } from './components/auth/RequireAuthOutlet';
import { PageLoading } from './components/mm/PageLoading';
import { routes } from './config/member-management';
import { MemberManagementLayout } from './layouts/MemberManagementLayout';
import { LoginPage } from './pages/LoginPage';
import { HomeEntry } from './pages/HomeEntry';
import { MemberPortalLayout } from './pages/member-portal/MemberPortalLayout';
import { MemberPortalIndex } from './pages/member-portal/MemberPortalIndex';
import { MemberWellnessLayout } from './pages/member-portal/MemberWellnessLayout';

const DashboardPage = lazy(() =>
  import('./pages/dashboard/DashboardPage').then((m) => ({
    default: m.DashboardPage,
  })),
);
const MembersPage = lazy(() =>
  import('./pages/MembersPage').then((m) => ({ default: m.MembersPage })),
);
const MemberDetailPage = lazy(() =>
  import('./pages/MemberDetailPage').then((m) => ({
    default: m.MemberDetailPage,
  })),
);
const MemberFormPage = lazy(() =>
  import('./pages/MemberFormPage').then((m) => ({ default: m.MemberFormPage })),
);
const MemberPhysicalTablePage = lazy(() =>
  import('./pages/MemberPhysicalTablePage').then((m) => ({
    default: m.MemberPhysicalTablePage,
  })),
);
const StaffListPage = lazy(() =>
  import('./pages/StaffListPage').then((m) => ({ default: m.StaffListPage })),
);
const StaffDetailPage = lazy(() =>
  import('./pages/StaffDetailPage').then((m) => ({
    default: m.StaffDetailPage,
  })),
);
const StaffFormPage = lazy(() =>
  import('./pages/StaffFormPage').then((m) => ({ default: m.StaffFormPage })),
);
const MembershipPlansPage = lazy(() =>
  import('./pages/MembershipPlansPage').then((m) => ({
    default: m.MembershipPlansPage,
  })),
);
const MembershipPlanFormPage = lazy(() =>
  import('./pages/MembershipPlanFormPage').then((m) => ({
    default: m.MembershipPlanFormPage,
  })),
);
const MembershipPaymentsPage = lazy(() =>
  import('./pages/MembershipPaymentsPage').then((m) => ({
    default: m.MembershipPaymentsPage,
  })),
);
const ManualMembershipPaymentPage = lazy(() =>
  import('./pages/ManualMembershipPaymentPage').then((m) => ({
    default: m.ManualMembershipPaymentPage,
  })),
);
const PosSellPage = lazy(() =>
  import('./pages/PosSellPage').then((m) => ({ default: m.PosSellPage })),
);
const PosSalesRegisterPage = lazy(() =>
  import('./pages/PosSalesRegisterPage').then((m) => ({
    default: m.PosSalesRegisterPage,
  })),
);
const PosStockPage = lazy(() =>
  import('./pages/PosStockPage').then((m) => ({ default: m.PosStockPage })),
);
const ActivitiesListPage = lazy(() =>
  import('./pages/activities/ActivitiesListPage').then((m) => ({
    default: m.ActivitiesListPage,
  })),
);
const ActivityDetailPage = lazy(() =>
  import('./pages/activities/ActivityDetailPage').then((m) => ({
    default: m.ActivityDetailPage,
  })),
);
const ActivityFormPage = lazy(() =>
  import('./pages/activities/ActivityFormPage').then((m) => ({
    default: m.ActivityFormPage,
  })),
);
const TrainingRoutinesListPage = lazy(() =>
  import('./pages/training/TrainingRoutinesListPage').then((m) => ({
    default: m.TrainingRoutinesListPage,
  })),
);
const TrainingRoutineFormPage = lazy(() =>
  import('./pages/training/TrainingRoutineFormPage').then((m) => ({
    default: m.TrainingRoutineFormPage,
  })),
);
const TrainingAssignmentsListPage = lazy(() =>
  import('./pages/training/TrainingAssignmentsListPage').then((m) => ({
    default: m.TrainingAssignmentsListPage,
  })),
);
const TrainingAssignmentFormPage = lazy(() =>
  import('./pages/training/TrainingAssignmentFormPage').then((m) => ({
    default: m.TrainingAssignmentFormPage,
  })),
);
const NutritionOverviewPage = lazy(() =>
  import('./pages/nutrition/NutritionOverviewPage').then((m) => ({
    default: m.NutritionOverviewPage,
  })),
);
const NutritionPlanPage = lazy(() =>
  import('./pages/nutrition/NutritionPlanPage').then((m) => ({
    default: m.NutritionPlanPage,
  })),
);
const AccessControlKioskPage = lazy(() =>
  import('./pages/access-control/AccessControlKioskPage').then((m) => ({
    default: m.AccessControlKioskPage,
  })),
);
const AccessControlLogPage = lazy(() =>
  import('./pages/access-control/AccessControlLogPage').then((m) => ({
    default: m.AccessControlLogPage,
  })),
);
const MemberWeeklyDietPage = lazy(() =>
  import('./pages/member-portal/MemberWeeklyDietPage').then((m) => ({
    default: m.MemberWeeklyDietPage,
  })),
);
const MemberWeeklyRoutinePage = lazy(() =>
  import('./pages/member-portal/MemberWeeklyRoutinePage').then((m) => ({
    default: m.MemberWeeklyRoutinePage,
  })),
);

function LazyPage({ children }: { children: ReactNode }) {
  return <Suspense fallback={<PageLoading />}>{children}</Suspense>;
}

function GestActividadesToEjercicios() {
  const loc = useLocation();
  const to =
    loc.pathname.replace('/gestion/actividades', '/gestion/ejercicios') +
    loc.search;
  return <Navigate to={to} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<RequireAuthOutlet />}>
        <Route path="/home" element={<HomeEntry />} />
        <Route
          path="/recepcion/control-acceso"
          element={
            <LazyPage>
              <AccessControlKioskPage />
            </LazyPage>
          }
        />

        <Route path="/socio" element={<MemberPortalLayout />}>
        <Route index element={<MemberPortalIndex />} />
        <Route path="nutricion-ejercicio" element={<MemberWellnessLayout />}>
          <Route index element={<Navigate to="dieta" replace />} />
          <Route
            path="dieta"
            element={
              <LazyPage>
                <MemberWeeklyDietPage />
              </LazyPage>
            }
          />
          <Route
            path="rutina"
            element={
              <LazyPage>
                <MemberWeeklyRoutinePage />
              </LazyPage>
            }
          />
        </Route>
      </Route>

      <Route path="/gestion" element={<MemberManagementLayout />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route
          path="dashboard"
          element={
            <LazyPage>
              <DashboardPage />
            </LazyPage>
          }
        />
        <Route path="socios">
          <Route
            index
            element={
              <LazyPage>
                <MembersPage />
              </LazyPage>
            }
          />
          <Route
            path="nuevo"
            element={
              <LazyPage>
                <MemberFormPage mode="create" />
              </LazyPage>
            }
          />
          <Route
            path=":id/tabla-fisica"
            element={
              <LazyPage>
                <MemberPhysicalTablePage />
              </LazyPage>
            }
          />
          <Route
            path=":id/edit"
            element={
              <LazyPage>
                <MemberFormPage mode="edit" />
              </LazyPage>
            }
          />
          <Route
            path=":id"
            element={
              <LazyPage>
                <MemberDetailPage />
              </LazyPage>
            }
          />
        </Route>
        <Route path="personal">
          <Route
            index
            element={
              <LazyPage>
                <StaffListPage />
              </LazyPage>
            }
          />
          <Route
            path="nuevo"
            element={
              <LazyPage>
                <StaffFormPage mode="create" />
              </LazyPage>
            }
          />
          <Route
            path=":id/edit"
            element={
              <LazyPage>
                <StaffFormPage mode="edit" />
              </LazyPage>
            }
          />
          <Route
            path=":id"
            element={
              <LazyPage>
                <StaffDetailPage />
              </LazyPage>
            }
          />
        </Route>
        <Route path="membresias">
          <Route
            index
            element={
              <LazyPage>
                <MembershipPlansPage />
              </LazyPage>
            }
          />
          <Route
            path="nuevo"
            element={
              <LazyPage>
                <MembershipPlanFormPage mode="create" />
              </LazyPage>
            }
          />
          <Route
            path=":id/edit"
            element={
              <LazyPage>
                <MembershipPlanFormPage mode="edit" />
              </LazyPage>
            }
          />
        </Route>
        <Route path="cobro/membresias">
          <Route
            index
            element={
              <LazyPage>
                <MembershipPaymentsPage />
              </LazyPage>
            }
          />
          <Route
            path="registrar"
            element={
              <LazyPage>
                <ManualMembershipPaymentPage />
              </LazyPage>
            }
          />
        </Route>
        <Route
          path="control-acceso/registro"
          element={
            <LazyPage>
              <AccessControlLogPage />
            </LazyPage>
          }
        />
        <Route
          path="control-acceso"
          element={<Navigate to="/recepcion/control-acceso" replace />}
        />
        <Route
          path="pago/membresia"
          element={<Navigate to="/gestion/cobro/membresias" replace />}
        />
        <Route
          path="pago/membresia/registrar"
          element={
            <Navigate to="/gestion/cobro/membresias/registrar" replace />
          }
        />
        <Route
          path="punto-venta/vender"
          element={
            <LazyPage>
              <PosSellPage />
            </LazyPage>
          }
        />
        <Route
          path="punto-venta/ventas"
          element={
            <LazyPage>
              <PosSalesRegisterPage />
            </LazyPage>
          }
        />
        <Route
          path="punto-venta/stock"
          element={
            <LazyPage>
              <PosStockPage />
            </LazyPage>
          }
        />
        <Route path="actividades/*" element={<GestActividadesToEjercicios />} />
        <Route path="ejercicios">
          <Route
            index
            element={
              <LazyPage>
                <ActivitiesListPage />
              </LazyPage>
            }
          />
          <Route
            path="nuevo"
            element={
              <LazyPage>
                <ActivityFormPage mode="create" />
              </LazyPage>
            }
          />
          <Route
            path=":id/edit"
            element={
              <LazyPage>
                <ActivityFormPage mode="edit" />
              </LazyPage>
            }
          />
          <Route
            path=":id"
            element={
              <LazyPage>
                <ActivityDetailPage />
              </LazyPage>
            }
          />
        </Route>
        <Route path="nutricion">
          <Route
            index
            element={
              <LazyPage>
                <NutritionOverviewPage />
              </LazyPage>
            }
          />
          <Route
            path="nuevo"
            element={
              <LazyPage>
                <NutritionPlanPage />
              </LazyPage>
            }
          />
          <Route
            path=":memberId"
            element={
              <LazyPage>
                <NutritionPlanPage />
              </LazyPage>
            }
          />
        </Route>
        <Route path="rutinas">
          <Route
            index
            element={
              <LazyPage>
                <TrainingRoutinesListPage />
              </LazyPage>
            }
          />
          <Route
            path="nuevo"
            element={
              <LazyPage>
                <TrainingRoutineFormPage mode="create" />
              </LazyPage>
            }
          />
          <Route path="asignaciones">
            <Route
              index
              element={
                <LazyPage>
                  <TrainingAssignmentsListPage />
                </LazyPage>
              }
            />
            <Route
              path="nuevo"
              element={
                <LazyPage>
                  <TrainingAssignmentFormPage />
                </LazyPage>
              }
            />
          </Route>
          <Route
            path=":id/edit"
            element={
              <LazyPage>
                <TrainingRoutineFormPage mode="edit" />
              </LazyPage>
            }
          />
        </Route>
      </Route>

        <Route
          path="/members/*"
          element={<Navigate to={routes.socios} replace />}
        />
      </Route>

      <Route path="/" element={<AppRootRedirect />} />
      <Route path="*" element={<AuthCatchAll />} />
    </Routes>
  );
}
