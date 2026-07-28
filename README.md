# Club360

Sistema de gestión de gimnasios (**React + NestJS + Prisma + MariaDB**).

**Documentación completa (única):** [`DOCUMENTACION.md`](./DOCUMENTACION.md) — incluye diagrama de arquitectura, arranque, BD/backups, Docker, deploy, MCP y reglas para agentes.

## Inicio rápido

```bash
npm run db:up
cd backend && npm run db:seed && cd ..
npm run api    # :3000
npm run web    # :5173
```

Admin demo: `admin` / `admin`

Repo: [github.com/Higanws/360_CLUB](https://github.com/Higanws/360_CLUB)

## Acceso SSH al VPS

Para entrar al VPS desde tu terminal local:

```bash
ssh -i "/Users/Personal/Projects/360_CLUB/.cursor/cloudflare.pem" root@187.33.154.45
```

Si aparece error de permisos de la clave:

```bash
chmod 600 "/Users/Personal/Projects/360_CLUB/.cursor/cloudflare.pem"
```

Luego reintentá el comando `ssh`.

Comandos útiles una vez dentro:

```bash
pwd
ls -la
cd /opt/360_CLUB
```

Para ver backups en el host:

```bash
cd /opt/backup
ls -lah
```

Para salir del VPS:

```bash
exit
```
