# Changelog

All notable changes to this demo are documented here.

## [1.0.2-demo] — 2026-10-26

### Added

- Capa **demo mock** (`src/lib/demo/`, `DEMO_MOCK=true`): fixtures en memoria, sin PostgreSQL en Netlify/Vercel.
- `.npmrc` y `legacy-peer-deps` para instalación estable en CI.
- `docs/FRONTEND-ARCHITECTURE.md` ampliado (tablas, roles, flujos, entidades mock).

### Changed

- Build hosted: `npm run build:demo` (`next build` sin adapter DB).
- Documentación de despliegue orientada a mock; eliminada dependencia de `@payloadcms/db-postgres`.

## [1.0.1-demo] — 2026-10-26

### Added

- Despliegue **Vercel / Netlify**: `netlify.toml`, `vercel.json`, `.env.example`.
- Loader de imágenes independiente de Figma para hosting propio.

### Changed

- `payload.config.ts` dual: Figma Make vs stub demo.
- Node engine ≥ 20.11; `.nvmrc` en 22.

## [1.0.0-demo] — 2026-10-26

### Added

- Entrada de inventario por **código de barras** (lector USB) y **carga rápida** por texto.
- Flujo de analítica con **Procesar analítica** (simulación ETL) y KPIs en cero por defecto.
- Descarga de PDF de analítica vía `fetch` con manejo de errores y validación de contenido.
- Script `scripts/seed-demo-analytics.mjs` para ampliar datos de ejemplo.
- Documentación: `README`, `DESIGN.md`, `docs/FRONTEND-ARCHITECTURE.md`, `docs/DEPLOYMENT.md`.

### Changed

- Reorganización de documentación en `docs/`; raíz solo archivos esenciales.
- Paquete renombrado a `mundo-pinturas-diana-demo`.

### Fixed

- Generación de PDF de analítica (fuentes PDFKit y respuesta HTTP).
