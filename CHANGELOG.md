# Changelog

All notable changes to this demo are documented here.

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
