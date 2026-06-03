# Modelo nutricional

## Estructura

Un plan nutricional por socio contiene `schedule_slots`: array de franjas.

Cada franja:

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `weekday` | 0–6 | 0=domingo, 1=lunes, … 6=sábado |
| `hour` | 5–23 | Hora del día |
| `event` | string | Nombre (ej. "Desayuno", "Almuerzo") |
| `dish` | string? | Plato / descripción |
| `ingredients` | array? | `{ name, quantity }` |

## Importante

La API REST hace **PUT** con el plan **completo**. Las tools `nutrition_meal_*` hacen GET + merge + PUT internamente.

## Parámetros en tools

- `weekday_name`: "lunes", "martes", … (español o inglés).
- `weekday`: número 0–6 (alternativa).
- `hour`: hora exacta si hay varias franjas el mismo día.
- `meal_event`: texto parcial del nombre del evento ("Almuerzo").

## Ejemplo

Actualizar almuerzo del lunes:

```json
{
  "member_query": "Juan",
  "weekday_name": "lunes",
  "meal_event": "Almuerzo",
  "dish": "Pollo con ensalada",
  "ingredients": [{ "name": "Pollo", "quantity": "200g" }]
}
```
