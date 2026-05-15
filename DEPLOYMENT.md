# Guía de despliegue — Club360 (Recreacion_react)

Esta app tiene **tres piezas** que conviene separar en producción:

| Pieza | Tecnología | Dónde desplegar bien |
|--------|------------|----------------------|
| **Frontend** | React + Vite | **Vercel**, Netlify, Cloudflare Pages |
| **API** | NestJS + TypeORM | **Railway**, **Render**, Fly.io, VPS |
| **Base de datos** | MariaDB / MySQL | MySQL gestionado (Railway, Aiven, DigitalOcean, etc.) |

> **No conviene subir todo a Vercel.** Vercel está pensado para sitios estáticos y funciones serverless cortas. Tu **backend Nest** mantiene conexión a MySQL, usa el **asistente de instalación** con archivos en disco (`backend/data/installed.txt`) y `prisma migrate deploy`: encaja mejor en un **servicio con proceso Node persistente**.

---

## Costos referenciales en pesos argentinos (ARS)

Los proveedores facturan en **USD** (tarjeta internacional). Los montos en ARS son **orientativos**; recalculá con el tipo de cambio del día (oficial, MEP o el que uses para pagar).

**Tipo de cambio usado en esta guía:** `1 USD ≈ AR$ 1.100`  
*(Actualizá esta cifra al desplegar; en Argentina el dólar mueve mucho.)*

### Resumen por escenario (mensual)

| Escenario | Qué incluye | USD aprox. | ARS aprox. (× 1.100) |
|-----------|-------------|------------|----------------------|
| **MVP / prueba** | Vercel Hobby (front) + Railway Hobby (API + MySQL ligero) | US$ 0 – 15 | **AR$ 0 – 16.500** |
| **Producción chica** | Vercel Pro + Railway Pro + MySQL dedicado pequeño | US$ 45 – 70 | **AR$ 49.500 – 77.000** |
| **Un solo VPS** | DigitalOcean / Hetzner (front + API + MariaDB en el mismo servidor) | US$ 12 – 24 | **AR$ 13.200 – 26.400** |

### Desglose por servicio

| Servicio | Plan | USD/mes (ref.) | ARS/mes (ref.) | Notas |
|----------|------|----------------|----------------|--------|
| **Vercel** | Hobby | US$ 0 | **AR$ 0** | Proyectos personales; límites de uso |
| **Vercel** | Pro (1 usuario) | US$ 20 | **AR$ 22.000** | Equipo / dominio custom / más ancho de banda |
| **Railway** | Hobby | US$ 5 crédito incl. | **~AR$ 5.500** | API + MySQL; pago por consumo si pasás el crédito |
| **Railway** | Pro | US$ 20/asiento + uso | **desde ~AR$ 22.000** | Producción con más recursos |
| **Render** | Web Service (API) | US$ 7+ | **desde ~AR$ 7.700** | Instancia siempre activa (no free tier eterno fiable) |
| **Render** | PostgreSQL | US$ 7+ | **desde ~AR$ 7.700** | Este proyecto usa **MySQL**, no Postgres en Render |
| **Aiven** | MySQL pequeño | US$ 15 – 30 | **AR$ 16.500 – 33.000** | MySQL gestionado, buena opción si la API está en otro lado |
| **DigitalOcean** | Droplet 2 GB | US$ 12 | **AR$ 13.200** | Todo en un servidor (ver opción VPS) |
| **Dominio .com** | anual | US$ 10 – 15/año | **AR$ 11.000 – 16.500/año** | Opcional |

**Impuestos Argentina:** muchas tarjetas suman **percepción / IVA digital** (~20–35 % extra sobre el USD). Para presupuesto real: `precio USD × tipo de cambio × 1,25` (margen conservador).

---

## Arquitectura recomendada (Vercel + Railway)

```text
Usuario → https://tu-club.vercel.app  (frontend estático)
              ↓  VITE_API_URL
          https://api-tu-club.up.railway.app/api  (NestJS)
              ↓  DATABASE_*
          MySQL gestionado (Railway u otro)
```

### Ventajas

- Front en CDN global (rápido, barato).
- API con disco persistente para el wizard y reinicios controlados.
- MySQL compatible con MariaDB local y con Prisma.

---

## Requisitos previos

- Repositorio en **GitHub** / GitLab (conectado a Vercel y Railway).
- Cuenta en [Vercel](https://vercel.com) y [Railway](https://railway.com) (u otro PaaS para la API).
- Node **20+** en local para probar builds:

```powershell
cd Recreacion_react\frontend
npm run build

cd ..\backend
npm run build
```

---

## 1. Base de datos (MySQL / MariaDB)

### Opción A — MySQL en Railway (simple)

1. Crear proyecto en Railway → **Add MySQL**.
2. Copiar variables: host, puerto, usuario, contraseña, base.
3. Armar `DATABASE_URL`:

```text
mysql://USUARIO:CONTRASEÑA@HOST:PUERTO/NOMBRE_BD
```

### Opción B — Aiven / DigitalOcean Managed MySQL

Mismo formato de URL. Asegurate de permitir conexiones desde la IP o red del proveedor de la API (Railway suele usar egress dinámico → activar **acceso desde cualquier IP** con contraseña fuerte y TLS si está disponible).

### Migraciones (sin wizard en servidor, opcional)

Si preferís **no** usar el wizard en producción y solo aplicar esquema + datos demo:

```powershell
cd backend
$env:DATABASE_URL="mysql://..."
npx prisma migrate deploy
```

El **wizard** en producción también puede hacer: vaciado total → `migrate deploy` → población inicial (ver sección 4).

---

## 2. Desplegar la API (NestJS) en Railway

### Configuración del servicio

| Campo | Valor |
|--------|--------|
| **Root directory** | `Recreacion_react/backend` (o `backend` si el repo es solo `Recreacion_react`) |
| **Build command** | `npm install && npm run build` |
| **Start command** | `npm run start:prod` |
| **Puerto** | Railway inyecta `PORT`; Nest ya usa `process.env.PORT` |

### Variables de entorno (API)

```env
NODE_ENV=production
PORT=3000

# URL pública del front (sin barra final)
FRONTEND_URL=https://tu-club.vercel.app

DATABASE_HOST=...
DATABASE_PORT=3306
DATABASE_USER=...
DATABASE_PASSWORD=...
DATABASE_NAME=...
DATABASE_URL=mysql://...

JWT_SECRET=genera-un-secreto-largo-aleatorio-minimo-32-caracteres
JWT_ACCESS_SECONDS=1800
JWT_REFRESH_SECONDS=604800
```

Generar `JWT_SECRET` (PowerShell):

```powershell
[Convert]::ToBase64String((1..48 | ForEach-Object { Get-Random -Maximum 256 }) -as [byte[]])
```

### Dominio de la API

Railway asigna algo como `https://club360-api-production-xxxx.up.railway.app`.  
La API expone rutas bajo **`/api`** (ej.: `/api/auth/login`, `/api/install/status`).

---

## 3. Desplegar el frontend en Vercel

### Configuración del proyecto

| Campo | Valor |
|--------|--------|
| **Framework** | Vite |
| **Root directory** | `Recreacion_react/frontend` |
| **Build command** | `npm run build` |
| **Output directory** | `dist` |

### Variables de entorno (Vercel)

```env
VITE_API_URL=https://TU-API.up.railway.app/api
```

Sin barra final en la URL base; el cliente axios ya usa rutas como `/auth/login`.

Opcional (subida de imágenes si las servís desde otro host):

```env
VITE_UPLOAD_BASE=https://tu-cdn-o-storage/...
```

### `vercel.json` (opcional, SPA)

Si al refrescar rutas como `/gestion/dashboard` ves 404, añadí en `frontend/vercel.json`:

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

---

## 4. Asistente de instalación (wizard) en producción

Flujo local: sin `backend/data/installed.txt` → solo rutas `/api/install/*` → wizard en el navegador.

En producción:

1. Desplegá **primero la API** (sin marcadores de instalación).
2. Desplegá el **front** con `VITE_API_URL` apuntando a esa API.
3. Abrí `https://tu-club.vercel.app` → debería aparecer el **InstallWizard**.
4. Completá el wizard (host/puerto/usuario/clave de MySQL, nombre de BD, admin).
5. El wizard:
   - hace **DROP** de todas las tablas y vistas;
   - comprueba **0 tablas**;
   - ejecuta **`prisma migrate deploy`** (baseline con población inicial);
   - escribe **`backend/.env`** en el servidor y **`data/installed.txt`**.
6. **Reiniciá el servicio de la API** en Railway (obligatorio: Nest carga TypeORM solo al arrancar).

Si algo falla: logs del servicio API en Railway → buscar errores de `prisma migrate deploy` o conexión MySQL.

### Repetir instalación limpia en servidor

Equivalente a local:

```powershell
# En el contenedor/volumen del backend, borrar marcadores y .env generado
# Luego reiniciar API y volver a abrir el front
```

En Railway, con volumen persistente en `backend/data`, podés borrar esos archivos desde shell o redeploy sin volumen.

---

## 5. CORS y seguridad

- `FRONTEND_URL` en la API debe coincidir **exactamente** con el origen del front (`https://tu-club.vercel.app`, sin `/` final).
- No subas `backend/.env` al repositorio.
- En producción usá contraseñas fuertes en MySQL y `JWT_SECRET` largo.
- El wizard **vacía toda la base** al ejecutarse: no lo corras contra una BD con datos reales que quieras conservar.

---

## 6. Otras plataformas (resumen)

### Netlify / Cloudflare Pages (solo frontend)

Igual que Vercel: build de `frontend`, variable `VITE_API_URL`, rewrite SPA. La API sigue en Railway/Render.

### Render (API + front)

- **Web Service** para `backend` con `npm run build` y `npm run start:prod`.
- **Static Site** para `frontend`.
- MySQL: usar Railway o Aiven (Render no ofrece MySQL gestionado nativo).

### Un solo VPS (DigitalOcean, Hetzner, etc.)

| Paso | Acción |
|------|--------|
| 1 | Ubuntu 22.04+, instalar Node 20, MariaDB, Nginx |
| 2 | Clonar repo, `npm install` en `backend` y `frontend` |
| 3 | `frontend`: `npm run build` → servir `dist` con Nginx |
| 4 | `backend`: `npm run build`, PM2 con `start:prod` |
| 5 | Nginx: `/api` → proxy a `localhost:3000` |
| 6 | MariaDB local o remoto; completar wizard una vez |

**Costo referencial:** US$ 12–24/mes → **AR$ 13.200 – 26.400** (más predecible que consumo por uso).

---

## 7. Checklist post-despliegue

- [ ] `GET https://TU-API/api/install/status` → `{ "installed": true }` (tras wizard)
- [ ] `GET https://TU-API/api/health/database` → `{ "ok": true }`
- [ ] Login admin con usuario/contraseña del wizard
- [ ] Dashboard carga métricas (`/api/dashboard/business-metrics`)
- [ ] Front sin errores CORS en consola del navegador
- [ ] Reinicio de API tras completar wizard

---

## 8. Comandos útiles en local (desarrollo)

```powershell
cd Recreacion_react

# API
npm run api

# Web (otra terminal)
npm run web

# Reset wizard (local)
powershell -NoProfile -ExecutionPolicy Bypass -File .\club360.ps1 -ResetInstall
```

Navegador: **http://localhost:5173**

---

## 9. Referencias del proyecto

| Recurso | Ruta |
|---------|------|
| Variables API ejemplo | `backend/.env.example` |
| Variables front ejemplo | `frontend/.env.example` |
| Migración baseline (esquema + demo) | `backend/prisma/migrations/20260121000000_club360_mvp_baseline/` |
| Reset instalación local | `club360.ps1 -ResetInstall` |

---

*Última actualización: arquitectura Club360 MVP con MariaDB local, wizard con vaciado total y una sola migración Prisma baseline.*
