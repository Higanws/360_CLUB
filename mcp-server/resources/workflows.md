# Flujos comunes (workflows)

## Crear un cliente / socio

1. `club360_session_status` — confirmar rol (admin para alta).
2. `member_create` con: `first_name`, `last_name`, `username`, `password`, `gender`, `di_dni_type`, `di_dni_number`.
3. Opcional: `selected_membership`, `assign_staff_mem`, fechas de membresía.

**Frases:** "creá un cliente", "alta de socio Juan Pérez".

## Cambiar comida de un cliente

1. `member_find` con nombre/DNI → obtener `id`.
2. `nutrition_meal_update` con `member_id`, `weekday_name` (ej. lunes), `meal_event` (ej. Almuerzo), `dish`, opcional `ingredients`.
3. Si no existe la franja: `nutrition_meal_add`.

**Frases:** "cambiá el almuerzo del lunes de Juan", "poné ensalada en la cena del martes".

## Cobrar membresía (admin)

1. `member_find` → `member_id`.
2. `membership_list` → elegir plan.
3. `payment_manual_register` con montos y fechas.

## Asignar rutina de entrenamiento

1. `member_find` → `member_id`.
2. `routine_list` → `routine_id`.
3. `assignment_create` con socio y rutina.

## Consultar métricas del club (admin)

1. `dashboard_business_metrics`.

## Ante duda

- `club360_list_capabilities` — tools disponibles para tu rol.
- `club360://guide/nutrition-model` — modelo de comidas.
- `club360://guide/permissions` — qué puede cada rol.
