# Dominio Club360

## Glosario

| Término usuario | Término sistema | Descripción |
|-----------------|-----------------|-------------|
| cliente, socio  | `gym_member`    | Persona inscripta en el club |
| staff, entrenador | `staff_member` | Personal del club |
| admin           | `administrator` | Acceso total |
| plan, membresía | `membership`    | Plan de cuota mensual |
| comida, plato, dieta | plan nutricional / `schedule_slots` | Franjas horarias con platos |

## Roles

- **administrator**: CRUD socios/staff, pagos, POS, dashboard, control de acceso.
- **staff_member**: socios (listado; solo los asignados en detalle), nutrición, rutinas, ejercicios.
- **member**: portal socio (no usa MCP operativo).

## Identificadores

- **member_id** (numérico): PK interna (`id` en API).
- **member_id** (string): código visible del socio en listados.
- Resolvé personas con `member_find` antes de mutar.

## Fechas

Formato ISO `YYYY-MM-DD` en API. Moneda por defecto en branding (`currency`, ej. ARS).
