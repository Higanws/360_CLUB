# Modo migración — importación en lotes

Importá datos desde un sistema legacy (Excel, CSV, otra app) hacia Club360 **en fases**, respetando dependencias entre tablas.

**Tools MCP:** `migration_requirements`, `migration_plan`, `migration_validate_batch`, `migration_import_batch`.

**Rol mínimo:** `administrator`.

No hay endpoints bulk en la API REST: cada ítem es un POST/PUT unitario orquestado por el MCP (máx. **200 ítems** por llamada).

---

## Flujo recomendado

1. `migration_plan` — orden de fases.
2. `migration_requirements` con `entity_type` — campos obligatorios de la sección.
3. `migration_validate_batch` — dry run del lote.
4. `migration_import_batch` con `dry_run: false`.
5. Acumular `id_map_updates` → pasar como `id_map` en la fase siguiente.

---

## Fases y dependencias

| Fase | Entidades | Depende de |
|------|-----------|------------|
| 1 | `membership_plan`, `activity_category` | — |
| 2 | `staff`, `activity` | categorías + staff (para trainers en actividades) |
| 3 | `member` | planes y staff (opcional) |
| 4 | `training_routine`, `training_assignment` | actividades, socios, staff |
| 5 | `nutrition_plan` | socios |

---

## id_map (referencias entre lotes)

Cada ítem puede incluir `source_id` (clave legacy, ej. `"cliente-001"`).

Tras importar, la respuesta trae `id_map_updates`: `{ "cliente-001": 42 }`.

En fases posteriores usá refs en lugar de IDs numéricos:

| Ref | Uso |
|-----|-----|
| `membership_ref` | Socio → plan |
| `staff_ref` | Socio → entrenador asignado |
| `category_ref` | Actividad → categoría |
| `trainer_refs` | Actividad / asignación → entrenadores |
| `activity_ref` | Línea de rutina → ejercicio |
| `routine_ref` | Asignación → rutina |
| `member_ref` / `member_refs` | Nutrición / asignación → socios |

---

## Requisitos por entidad (resumen)

### membership_plan → `POST /memberships`

**Obligatorio:** `membership_label`, `membership_amount`  
**Opcional:** `membership_period_days`, `installment_plan`, `signup_fee`, `description`, `image`

### activity_category → `POST /activities/categories`

**Obligatorio:** `name`

### activity → `POST /activities`

**Obligatorio:** `category_id` o `category_ref`, `title`, `difficulty_level` (`baja|media|alta`), `video_urls[]`, `trainer_member_ids[]` o `trainer_refs[]`  
**Opcional:** `description`

### staff → `POST /staff`

**Obligatorio:** `first_name`, `last_name`, `gender`, `birth_date`, `role`, `specialization_ids[]`, `address`, `city`, `mobile`, `email`, `username`, `password`  
Consultar `GET /staff/form-options` para IDs de rol y especialización.

### member → `POST /members`

**Obligatorio:** `first_name`, `last_name`, `username`, `password`, `gender`, `di_dni_type` (`DI|DNI`), `di_dni_number`  
**Opcional:** contacto, dirección, `selected_membership` / `membership_ref`, `assign_staff_mem` / `staff_ref`, fechas membresía, medidas físicas.

### training_routine → `POST /training-routines`

**Obligatorio:** `title`, `lines[]` con `activity_id` o `activity_ref`  
**Opcional por línea:** `weight_kg`, `weekdays_mask` (1–127, default todos los días)

### training_assignment → `POST /training-assignments`

**Obligatorio:** `routine_id` o `routine_ref`, `member_ids[]` o `member_refs[]`, `trainer_member_ids[]` o `trainer_refs[]`

### nutrition_plan → `PUT /nutrition/members/:memberId/plan`

**Obligatorio:** `member_id` o `member_ref`, `schedule_slots[]`  
**Slot:** `weekday` 0–6 (0=domingo), `hour` 5–23, `event`, opcional `dish`, `ingredients[{name, quantity}]`  
Ver `club360://guide/nutrition-model`.

---

## Ejemplo mínimo (fase 1 + 3)

```json
{
  "entity_type": "membership_plan",
  "items": [
    {
      "source_id": "plan-mensual",
      "membership_label": "Mensual",
      "membership_amount": 49
    }
  ]
}
```

```json
{
  "entity_type": "member",
  "id_map": { "plan-mensual": 3 },
  "items": [
    {
      "source_id": "legacy-001",
      "first_name": "Ana",
      "last_name": "García",
      "username": "ana.garcia",
      "password": "Temporal123",
      "gender": "female",
      "di_dni_type": "DNI",
      "di_dni_number": "12345678A",
      "membership_ref": "plan-mensual"
    }
  ]
}
```

---

## Buenas prácticas

- Validar siempre antes de importar (`migration_validate_batch`).
- Lotes pequeños (20–50) en producción; reintentar ítems fallidos.
- Usernames y DNI deben ser únicos.
- Nutrición reemplaza el plan completo del socio (upsert).
- No migrar contraseñas débiles: generar temporales y pedir cambio al primer acceso.

Para detalle de campos: `migration_requirements` con `entity_type`.
