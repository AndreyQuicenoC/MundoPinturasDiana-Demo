# Mundo Pinturas Diana — Demo operativa

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![Payload CMS](https://img.shields.io/badge/Payload-4.0--beta-000?logo=payloadcms)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38B2AC?logo=tailwind-css&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-6-3178C6?logo=typescript&logoColor=white)
![License](https://img.shields.io/badge/License-Proprietary-red)

Demo aprobada del ecosistema **Mundo Pinturas Diana**: sitio público de catálogo y panel interno (ventas, inventario, caja, analítica, domicilios y más) sobre **Next.js App Router**, **Payload CMS (Figma Make)** y **Tailwind CSS v4**.

## Demo en vivo

Despliega con **Figma Make → Publish** o sigue [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

## Accesos de demostración

| Rol | Correo | Contraseña |
|-----|--------|------------|
| Administrador | `admin@mundopinturasdiana.test` | `Admin#2026demo` |
| Gerente | `gerente@mundopinturasdiana.test` | `Gerente#2026demo` |
| Empleado | `empleado@mundopinturasdiana.test` | `Empleado#2026demo` |

Ruta de ingreso: `/login` → redirección al panel según rol.

## Características destacadas

- **Sitio público**: catálogo, sedes, carrito con WhatsApp, promociones y eventos.
- **Panel por rol**: permisos granulares (matriz + overrides por usuario).
- **Inventario**: entrada manual, lector de código de barras (USB/teclado) y carga rápida por texto (`SKU - CANTIDAD - costo`).
- **Analítica**: métricas en cero hasta **Procesar analítica** (simula ETL); PDF descargable tras procesar.
- **CMS**: Payload Admin en `/admin` (editores Figma SSO).

## Estructura del repositorio

```
src/
  app/(frontend)/     # Sitio y panel
  app/(payload)/      # Admin Payload (generado)
  collections/        # Modelo de datos
  components/         # UI
  lib/                # Lógica de servidor, acciones, analítica
docs/                 # Documentación extendida
scripts/              # Utilidades (seed de demo, etc.)
DESIGN.md             # Guía de UI/UX
CHANGELOG.md
LICENSE
```

## Documentación

| Documento | Contenido |
|-----------|-----------|
| [DESIGN.md](DESIGN.md) | Sistema visual, UX y patrones de interfaz |
| [docs/FRONTEND-ARCHITECTURE.md](docs/FRONTEND-ARCHITECTURE.md) | Arquitectura funcional del front (alineación con backend) |
| [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) | Publicación y verificación |
| [docs/AGENTS.md](docs/AGENTS.md) | Convenciones Figma Make / Payload para agentes |
| [CHANGELOG.md](CHANGELOG.md) | Historial de versiones |

## Desarrollo local

Requisitos: **Node ≥ 24.22**, **pnpm** (recomendado en Figma Make) o **npm**.

```bash
pnpm install   # o npm install
pnpm dev       # puerto $PORT (3000 por defecto en Make)
```

Ampliar datos de ejemplo para analítica (solo entorno Make con Payload conectado):

```bash
pnpm seed:demo-analytics
```

## Licencia

Software propietario — ver [LICENSE](LICENSE). Uso restringido a demostración y evaluación autorizada por Mundo Pinturas Diana.
