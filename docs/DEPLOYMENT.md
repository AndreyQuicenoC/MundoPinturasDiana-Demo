# Despliegue — Vercel / Netlify (recomendado)

Esta demo está preparada para **Vercel** o **Netlify** con **PostgreSQL** (Neon, Supabase, Vercel Postgres, etc.). Figma Make sigue siendo opcional si `FIGMA=1`.

## 1. Base de datos

1. Crea un proyecto PostgreSQL (ej. [Neon](https://neon.tech) gratis).
2. Copia la URL de conexión (`postgresql://…?sslmode=require`).

## 2. Variables de entorno

En el panel de Vercel o Netlify → **Environment variables**:

| Variable | Obligatorio | Descripción |
|----------|-------------|-------------|
| `DATABASE_URI` | Sí | URL PostgreSQL (alias aceptado: `DATABASE_URL`) |
| `PAYLOAD_SECRET` | Sí | Secreto ≥ 16 caracteres (genera uno aleatorio) |
| `PAYLOAD_DB_PUSH` | Sí al inicio | `true` para crear tablas; luego puedes poner `false` |
| `SEED_DEMO` | Recomendado 1.er deploy | `true` crea usuarios demo y catálogo tras el build |
| `NEXT_PUBLIC_SITE_URL` | Recomendado | URL final (`https://tu-app.netlify.app`) |

**No** definas `FIGMA=1` en Vercel/Netlify.

### Usuarios demo (tras seed)

| Rol | Correo | Contraseña |
|-----|--------|------------|
| Admin | admin@mundopinturasdiana.test | Admin#2026demo |
| Gerente | gerente@mundopinturasdiana.test | Gerente#2026demo |
| Empleado | empleado@mundopinturasdiana.test | Empleado#2026demo |

## 3. Netlify

1. **Add new site → Import from Git** → repo `MundoPinturasDiana-Demo`.
2. Build command: **`npm run build:hosted`** (ya viene en `netlify.toml`).
3. No configures “Publish directory” manualmente; usa el plugin **@netlify/plugin-nextjs**.
4. Node **22** (`.nvmrc`).
5. Deploy.

Si ves *“Site not found”*: suele ser URL incorrecta, sitio sin deploy exitoso o publish directory mal puesto. Borra publish manual y vuelve a desplegar desde Git.

## 4. Vercel

1. Importa el repositorio en [vercel.com](https://vercel.com).
2. Framework: **Next.js** (detectado).
3. Build command: **`npm run build:hosted`** (`vercel.json`).
4. Añade las mismas variables de entorno.
5. Deploy.

## 5. Después del primer deploy

1. Entra a `/login` y prueba los usuarios demo.
2. Opcional: más datos de analítica (con BD ya sembrada):

   ```bash
   DATABASE_URI=... PAYLOAD_SECRET=... npm run seed:demo-analytics
   ```

3. Pon `SEED_DEMO=false` en variables para builds siguientes (más rápidos).

## 6. Figma Make (opcional)

Si publicas desde Figma Make, la plataforma define `FIGMA=1` y usa `@payloadcms/figma` sin `DATABASE_URI`.

## Smoke test

| # | Caso | Esperado |
|---|------|----------|
| 1 | `/` | Home con catálogo |
| 2 | `/login` | Panel según rol |
| 3 | Analítica → Procesar | Datos (si hay ventas seed) |
| 4 | PDF analítica | Descarga tras procesar |
