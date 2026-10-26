# Despliegue — Vercel / Netlify (demo mock)

Esta demo está pensada para **Vercel** o **Netlify** **sin base de datos externa**. Los datos operativos viven en memoria (`DEMO_MOCK=true`). Figma Make sigue siendo opcional si defines `FIGMA=1` en ese entorno.

## 1. Variables de entorno

En el panel de Vercel o Netlify → **Environment variables**:

| Variable | Obligatorio | Descripción |
|----------|-------------|-------------|
| `DEMO_MOCK` | Sí | `true` — activa fixtures y mock-payload |
| `PAYLOAD_SECRET` | Sí | Secreto ≥ 32 caracteres (JWT de sesión demo) |
| `NEXT_PUBLIC_SITE_URL` | Recomendado | URL final (`https://tu-app.netlify.app`) |

**No** hace falta `DATABASE_URI`, `DATABASE_URL`, `PAYLOAD_DB_PUSH` ni `SEED_DEMO` para la demo mock.

**No** definas `FIGMA=1` en Vercel/Netlify salvo que uses la plataforma Figma Make.

### Usuarios demo (incluidos en fixtures)

| Rol | Correo | Contraseña |
|-----|--------|------------|
| Admin | admin@mundopinturasdiana.test | Admin#2026demo |
| Gerente | gerente@mundopinturasdiana.test | Gerente#2026demo |
| Empleado | empleado@mundopinturasdiana.test | Empleado#2026demo |

## 2. Netlify

1. **Add new site → Import from Git** → repo `MundoPinturasDiana-Demo`.
2. Build command: **`npm run build:demo`** (definido en `netlify.toml`).
3. No configures “Publish directory” manualmente; el plugin **@netlify/plugin-nextjs** lo gestiona.
4. Node **22** (variable `NODE_VERSION` en `netlify.toml`).
5. Añade `PAYLOAD_SECRET` y `NEXT_PUBLIC_SITE_URL` en el panel.
6. Deploy.

`netlify.toml` ya incluye:

- `DEMO_MOCK=true`
- `NPM_CONFIG_LEGACY_PEER_DEPS=true` (peer deps de Payload beta)
- `.npmrc` con `legacy-peer-deps=true` y `engine-strict=false`

Si el build falla en **Install dependencies**, revisa el log completo; con la versión mock (sin `@payloadcms/db-postgres`) `npm ci` debe completar. Si hay cola de deploys del equipo, espera a que terminen los builds anteriores.

## 3. Vercel

1. Importa el repositorio en [vercel.com](https://vercel.com).
2. Framework: **Next.js** (detectado).
3. Build command: **`npm run build:demo`** (`vercel.json`).
4. Variables: `DEMO_MOCK=true`, `PAYLOAD_SECRET`, `NEXT_PUBLIC_SITE_URL`.
5. Deploy.

## 4. Después del primer deploy

1. Entra a `/login` y prueba los usuarios demo.
2. Panel → **Analítica** → **Procesar analítica** (los KPIs arrancan en cero hasta procesar).
3. Descarga PDF desde analítica tras procesar.

### Limitaciones demo mock

- Las escrituras (ventas, entradas de inventario, etc.) persisten solo en memoria del proceso; en serverless pueden resetearse entre invocaciones frías.
- **`/admin` (Payload CMS)** no está disponible en modo `DEMO_MOCK` (build sin `withPayload`). Usa el panel en `/panel/...`.

## 5. Figma Make (opcional)

Si publicas desde Figma Make, la plataforma define `FIGMA=1` y usa `@payloadcms/figma` con Payload cloud. No uses `DEMO_MOCK` allí.

## 6. Backend real (futuro)

Cuando conectes PostgreSQL u otro datastore, consulta [FRONTEND-ARCHITECTURE.md](FRONTEND-ARCHITECTURE.md) para mapear entidades mock → API. Hasta entonces, trata `src/lib/demo/fixtures.ts` como contrato de datos de referencia.

## Smoke test

| # | Caso | Esperado |
|---|------|----------|
| 1 | `/` | Home con catálogo |
| 2 | `/login` | Acceso y panel según rol |
| 3 | `/panel/admin/analitica` | KPIs en 0 → Procesar → datos |
| 4 | PDF analítica | Descarga tras procesar |
| 5 | Inventario → entrada manual / barras / carga rápida | Kardex y saldos en sesión |
