# Errores de la API Club360

## Formato típico

```json
{
  "statusCode": 400,
  "message": "Descripción del error",
  "error": "Bad Request"
}
```

`message` puede ser string o array de strings (validación).

## Códigos frecuentes

| Código | Significado | Acción sugerida |
|--------|-------------|-----------------|
| 401 | Token inválido/expirado | El MCP reintenta login; si persiste, revisar credenciales env |
| 403 | Sin permiso para rol | Ver `club360://guide/permissions` |
| 404 | Recurso inexistente | `member_find` o verificar id |
| 409 | Conflicto (duplicado) | Cambiar username/DNI |
| 422/400 | Validación | Corregir campos del body |

## Respuesta de tools MCP

Éxito: `{ "ok": true, "data": ... }`

Error: `{ "ok": false, "statusCode": ..., "message": "...", "hint": "..." }`
