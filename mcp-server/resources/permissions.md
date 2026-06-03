# Permisos por rol

## administrator

Todas las tools MCP excepto las exclusivas de otro flujo.

Incluye: `member_delete`, `staff_*`, `membership_*`, `payment_*`, `dashboard_*`, `pos_*`, `access_*`.

## staff_member

- `member_find`, `member_get`, `member_update` (socios asignados; la API filtra).
- `nutrition_*`, `routine_*`, `assignment_*`, `activity_*`.
- **No** puede: `member_create`, `member_delete`, `staff_*`, `payment_*`, `pos_*`, `dashboard_*`, `access_*`, `membership_*` (CRUD planes).

## Errores 403

Si una tool devuelve 403, el rol no alcanza. Informá al usuario y no reintentes la misma acción.

## Staff y alcance de socios

Staff solo ve/edita socios con `assign_staff_mem` = su user id. Si no encuentra un socio, puede no estar asignado.
