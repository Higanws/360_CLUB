import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { routes } from './config/member-management';
import { MemberManagementLayout } from './layouts/MemberManagementLayout';
import { HomeEntry } from './pages/HomeEntry';
import { LoginPage } from './pages/LoginPage';
import { MemberDetailPage } from './pages/MemberDetailPage';
import { MemberFormPage } from './pages/MemberFormPage';
import { MemberPortalLayout } from './pages/member-portal/MemberPortalLayout';
import { MemberPortalIndex } from './pages/member-portal/MemberPortalIndex';
import { MemberWellnessLayout } from './pages/member-portal/MemberWellnessLayout';
import { MemberWeeklyDietPage } from './pages/member-portal/MemberWeeklyDietPage';
import { MemberWeeklyRoutinePage } from './pages/member-portal/MemberWeeklyRoutinePage';
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { MembersPage } from './pages/MembersPage';
import { StaffDetailPage } from './pages/StaffDetailPage';
import { StaffFormPage } from './pages/StaffFormPage';
import { ManualMembershipPaymentPage } from './pages/ManualMembershipPaymentPage';
import { MembershipPaymentsPage } from './pages/MembershipPaymentsPage';
import { MembershipPlanFormPage } from './pages/MembershipPlanFormPage';
import { MembershipPlansPage } from './pages/MembershipPlansPage';
import { PosSellPage } from './pages/PosSellPage';
import { PosSalesRegisterPage } from './pages/PosSalesRegisterPage';
import { PosStockPage } from './pages/PosStockPage';
import { StaffListPage } from './pages/StaffListPage';
import { ActivitiesListPage } from './pages/activities/ActivitiesListPage';
import { ActivityDetailPage } from './pages/activities/ActivityDetailPage';
import { ActivityFormPage } from './pages/activities/ActivityFormPage';
import { TrainingRoutinesListPage } from './pages/training/TrainingRoutinesListPage';
import { TrainingRoutineFormPage } from './pages/training/TrainingRoutineFormPage';
import { TrainingAssignmentsListPage } from './pages/training/TrainingAssignmentsListPage';
import { TrainingAssignmentFormPage } from './pages/training/TrainingAssignmentFormPage';
import { NutritionOverviewPage } from './pages/nutrition/NutritionOverviewPage';
import { NutritionPlanPage } from './pages/nutrition/NutritionPlanPage';
import { MemberPhysicalTablePage } from './pages/MemberPhysicalTablePage';
import { AccessControlKioskPage } from './pages/access-control/AccessControlKioskPage';
import { AccessControlLogPage } from './pages/access-control/AccessControlLogPage';

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
      <Route path="/home" element={<HomeEntry />} />
      <Route path="/recepcion/control-acceso" element={<AccessControlKioskPage />} />

      <Route path="/socio" element={<MemberPortalLayout />}>
        <Route index element={<MemberPortalIndex />} />
        <Route path="nutricion-ejercicio" element={<MemberWellnessLayout />}>
          <Route index element={<Navigate to="dieta" replace />} />
          <Route path="dieta" element={<MemberWeeklyDietPage />} />
          <Route path="rutina" element={<MemberWeeklyRoutinePage />} />
        </Route>
      </Route>

      <Route path="/gestion" element={<MemberManagementLayout />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="socios">
          <Route index element={<MembersPage />} />
          <Route path="nuevo" element={<MemberFormPage mode="create" />} />
          <Route
            path=":id/tabla-fisica"
            element={<MemberPhysicalTablePage />}
          />
          <Route path=":id/edit" element={<MemberFormPage mode="edit" />} />
          <Route path=":id" element={<MemberDetailPage />} />
        </Route>
        <Route path="personal">
          <Route index element={<StaffListPage />} />
          <Route path="nuevo" element={<StaffFormPage mode="create" />} />
          <Route path=":id/edit" element={<StaffFormPage mode="edit" />} />
          <Route path=":id" element={<StaffDetailPage />} />
        </Route>
        <Route path="membresias">
          <Route index element={<MembershipPlansPage />} />
          <Route path="nuevo" element={<MembershipPlanFormPage mode="create" />} />
          <Route path=":id/edit" element={<MembershipPlanFormPage mode="edit" />} />
        </Route>
        <Route path="cobro/membresias">
          <Route index element={<MembershipPaymentsPage />} />
          <Route
            path="registrar"
            element={<ManualMembershipPaymentPage />}
          />
        </Route>
        <Route
          path="control-acceso/registro"
          element={<AccessControlLogPage />}
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
          element={<Navigate to="/gestion/cobro/membresias/registrar" replace />}
        />
        <Route path="punto-venta/vender" element={<PosSellPage />} />
        <Route path="punto-venta/ventas" element={<PosSalesRegisterPage />} />
        <Route path="punto-venta/stock" element={<PosStockPage />} />
        <Route path="actividades/*" element={<GestActividadesToEjercicios />} />
        <Route path="ejercicios">
          <Route index element={<ActivitiesListPage />} />
          <Route path="nuevo" element={<ActivityFormPage mode="create" />} />
          <Route path=":id/edit" element={<ActivityFormPage mode="edit" />} />
          <Route path=":id" element={<ActivityDetailPage />} />
        </Route>
        <Route path="nutricion">
          <Route index element={<NutritionOverviewPage />} />
          <Route path="nuevo" element={<NutritionPlanPage />} />
          <Route path=":memberId" element={<NutritionPlanPage />} />
        </Route>
        <Route path="rutinas">
          <Route index element={<TrainingRoutinesListPage />} />
          <Route
            path="nuevo"
            element={<TrainingRoutineFormPage mode="create" />}
          />
          <Route path="asignaciones">
            <Route index element={<TrainingAssignmentsListPage />} />
            <Route path="nuevo" element={<TrainingAssignmentFormPage />} />
          </Route>
          <Route
            path=":id/edit"
            element={<TrainingRoutineFormPage mode="edit" />}
          />
        </Route>
      </Route>

      <Route
        path="/members/*"
        element={<Navigate to={routes.socios} replace />}
      />

      <Route path="/" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
