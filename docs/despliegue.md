# Despliegue y demo pública

Dos escenarios: **demo con túnel** (tu PC + Cloudflare) y **producción en VPS**.

Desarrollo diario y reglas de BD: [desarrollo.md](./desarrollo.md).

Repositorio: [github.com/Higanws/360_CLUB](https://github.com/Higanws/360_CLUB)

---

## 1. Demo rápida (túnel sin deploy)

Tu PC es el servidor; Cloudflare publica un enlace HTTPS temporal (`*.trycloudflare.com`). **Sin cuenta** Cloudflare (Quick Tunnel).

| Qué | Detalle |
|-----|---------|
| Mientras corre | El enlace funciona con la terminal del túnel abierta |
| Al cerrar | Ctrl+C → el enlace deja de funcionar |
| Nueva ejecución | URL nueva cada vez |
| Producción | No usar Quick Tunnel como prod |

### Requisitos

- Node 20+
- MariaDB/MySQL + `backend/.env`
- Datos demo: `cd backend && npm run db:seed` o wizard ([desarrollo.md](./desarrollo.md))

### Pasos (3 terminales)

```powershell
cd ruta\al\repo\360_club
npm run api          # Terminal 1
npm run web          # Terminal 2
npm run demo:tunnel  # Terminal 3 → copiar URL trycloudflare.com
```

Comprobá local: http://localhost:5173

Vite hace proxy `/api` → `localhost:3000`. **No** abras un segundo túnel al puerto 3000.

### Alternativas

```powershell
npx --yes cloudflared tunnel --url http://localhost:5173
```

También: `localtunnel`, `ngrok`.

### Seguridad

- Quien tenga el enlace accede a tu instancia local.
- No uses datos sensibles reales.
- Cerrá el túnel al terminar.

### Problemas frecuentes

| Síntoma | Revisar |
|---------|---------|
| Login falla | `npm run api` + MariaDB |
| Host not allowed | Reiniciar `npm run web` |
| Enlace muerto | Usar URL **nueva** del túnel |

### Reset antes de demo

```powershell
cd backend
npm run db:seed
```

Credenciales: [base-de-datos.md](./base-de-datos.md).

Reset wizard: borrar `backend/data/installed.txt` y `.env` generado.

---

## 2. Producción en VPS

```text
Usuario → https://tu-dominio.com
            ├── /     → Nginx → frontend/dist
            └── /api  → proxy → NestJS :3000 → MariaDB
```

### Pasos resumidos

| Paso | Acción |
|------|--------|
| 1 | Ubuntu 22.04+: Node 20, MariaDB, Nginx, PM2 |
| 2 | Clonar repo |
| 3 | `backend`: install, build, `.env` |
| 4 | `frontend`: install, build → `dist` |
| 5 | Nginx: `dist` + `location /api { proxy_pass http://127.0.0.1:3000; }` |
| 6 | PM2: `npm run start:prod` en backend |
| 7 | Wizard (schema SQL + seed) → **reiniciar API** |
| 8 | TLS con Certbot |

### Variables API

```env
NODE_ENV=production
PORT=3000
FRONTEND_URL=https://tu-dominio.com
DATABASE_HOST=127.0.0.1
DATABASE_PORT=3306
DATABASE_USER=...
DATABASE_PASSWORD=...
DATABASE_NAME=...
DATABASE_URL=mysql://...
JWT_SECRET=secreto-largo-aleatorio-minimo-32-caracteres
```

JWT (PowerShell):

```powershell
[Convert]::ToBase64String((1..48 | ForEach-Object { Get-Random -Maximum 256 }) -as [byte[]])
```

### Frontend en VPS

Con Nginx + proxy `/api`, normalmente **no** hace falta `VITE_API_URL`. Dominios distintos:

```env
VITE_API_URL=https://api.tu-dominio.com/api
```

### Wizard en servidor

1. API sin `backend/data/installed.txt`.
2. InstallWizard en el sitio.
3. MySQL + admin → DROP + `schema_mysql.sql` + `seed_mvp.sql`.
4. Reiniciar API.

Migraciones Prisma en prod futuro: [desarrollo.md §4.4](./desarrollo.md#44-migraciones-prisma--solo-producción-futuro).

### Checklist post-despliegue

- [ ] `GET …/api/install/status` → `installed: true`
- [ ] `GET …/api/health/database` → `ok: true`
- [ ] Login admin
- [ ] Sin errores CORS (`FRONTEND_URL` correcto)

### Seguridad

- No subir `backend/.env`.
- Contraseñas fuertes y `JWT_SECRET` largo.
- El wizard **borra todas las tablas** de la BD elegida.

---

## Referencias

| Recurso | Ubicación |
|---------|-----------|
| Desarrollo | [desarrollo.md](./desarrollo.md) |
| Base de datos | [base-de-datos.md](./base-de-datos.md) |
| Docker | [docker.md](./docker.md) |
| Guía usuario | [guia-usuario.md](./guia-usuario.md) |
| `.env` ejemplo | `backend/.env.example`, `frontend/.env.example` |
