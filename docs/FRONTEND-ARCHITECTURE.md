# Arquitectura funcional del frontend — Mundo Pinturas Diana Demo

Documento de referencia para alinear el **backend** (APIs, ETL, integraciones) con lo que la demo visual ya implementa. Describe rutas, flujos, contratos de datos y colecciones Payload consumidas.

---

## 1. Resumen ejecutivo

| Capa | Tecnología | Responsabilidad |
|------|------------|-----------------|
| Presentación pública | Next.js RSC + Client Components | Catálogo, marketing, carrito WhatsApp |
| Panel operativo | Next.js App Router `(app)/panel` | ERP ligero por rol |
| Persistencia | Payload CMS (Figma Cloud) | Colecciones, auth app, uploads |
| Admin contenido | `/admin` Payload | CMS Figma SSO (no login público) |

**Zona horaria de negocio:** America/Bogotá (UTC−5) en fechas de caja, analítica y cierres.

---

## 2. Actores y autenticación

### 2.1 Tipos de usuario

| Actor | Colección | Acceso |
|-------|-----------|--------|
| Editor CMS | `admins` | `/admin` (Figma SSO) |
| Personal app | `users` | `/login` → `/panel/{rol}` |

Roles app: `admin` | `gerente` | `empleado`. Estado `activo` requerido.

### 2.2 Flujo de login app

1. `GET /login` — formulario (`login-form.tsx`).
2. Server Action valida credenciales contra colección `users` (Payload auth).
3. Cookie de sesión app (`app-auth.ts`).
4. Redirección a `/panel/{role}` o `next` seguro.

### 2.3 Autorización por módulo

- Matriz base: `src/lib/access.ts` → `PERMISSIONS[module][role]` con modos `total | ver | propio | none`.
- Overrides: colecciones `role-permissions`, `user-permissions` (`permissions.ts` → `effectiveForUser`).
- Escritura panel: `canWrite = mode === 'total'` (empleado suele ser `ver` o `propio` en inventario/productos).

**Backend debe replicar** la misma matriz en API y rechazar mutaciones no permitidas.

---

## 3. Mapa de rutas

### 3.1 Sitio público `(site)`

| Ruta | Fuente | Datos Payload |
|------|--------|---------------|
| `/` | `page.tsx` | productos, promociones, sedes, settings |
| `/catalogo` | listado | `products`, categorías |
| `/catalogo/[slug]` | detalle | `findBySlug('products')` |
| `/carrito` | carrito + WA | settings, branches |
| `/sedes` | sedes | `branches` |
| `/sobre-nosotros` | estático + copy | — |
| `/mapa-del-sitio` | índice | — |

Tracking: `POST /api/track` → `site-events` (`visit`, `whatsapp_cart`, `whatsapp_promo`).

### 3.2 Panel `(app)/panel`

| Ruta | Módulo | Componente |
|------|--------|--------------|
| `/panel` | redirect | por sesión |
| `/panel/[role]` | resumen | dashboard |
| `/panel/[role]/[module]` | dinámico | `_modules/{module}.tsx` |
| `/panel/[role]/reporte` | PDF analítica | `route.ts` GET |
| `/panel/[role]/imprimir/[id]` | factura/ticket | impresión venta |

Módulos (`ModuleKey`): `resumen`, `usuarios`, `permisos`, `sedes`, `categorias`, `productos`, `inventario`, `clientes`, `proveedores`, `ventas`, `pos`, `domicilios`, `facturacion`, `caja`, `conceptos`, `cierre`, `eventos`, `promociones`, `auditoria`, `analitica`.

---

## 4. Modelo de datos (colecciones)

Relación **frontend ↔ slug Payload**:

| Dominio | Slug | Uso en UI |
|---------|------|-----------|
| Usuarios app | `users` | login, panel usuarios |
| Sedes | `branches` | sitio, ventas, inventario, caja |
| Productos | `products` | catálogo, POS, inventario |
| Categorías producto | `product-categories` | filtros, analítica |
| Tipos producto | `product-types` | normal vs artístico (`affectsDailySales`) |
| Clientes | `clients` | ventas, Habeas Data |
| Proveedores | `suppliers` | entradas inventario |
| Stock | `inventory` | saldos por sede (solo lectura UI; mutación vía movimientos) |
| Movimientos | `inventory-movements` | kardex; tipos en `MOVEMENT_SIGN` |
| Ventas | `sales` | ventas, POS, analítica |
| Domicilios | `domicilios` | logística |
| Mensajeros | `couriers` | domicilios |
| Caja categorías | `cash-categories` | gastos/transferencias/ahorros |
| Conceptos caja | `cash-concepts` | plantillas movimiento |
| Movimientos caja | `cash-movements` | caja, analítica |
| Entregas efectivo | `cash-deliveries` | analítica |
| Cierres | `cash-closings` | cierre diario |
| Cuentas banco | `bank-accounts` | transferencias venta |
| Facturas electrónicas | `electronic-invoices` | facturación |
| Promociones | `promotions` | sitio + analítica WA |
| Eventos negocio | `events` | calendario; `importance: clave` marca meses atípicos |
| Eventos sitio | `site-events` | analítica tráfico |
| Auditoría | `audit-logs` | módulo auditoría |
| Notificaciones | `notifications` | campana panel |
| Permisos | `role-permissions`, `user-permissions` | permisos |
| Recuperación | `recovery-tokens` | flujo olvidé contraseña |
| Media | `media` | imágenes |
| Global | `site-settings` | WhatsApp, redes, dirección |

### 4.1 Producto (campos críticos)

- `sku` (único), `barcode`, `slug`, `salePrice`, `costPrice`, `minimumStock`, `origin` (`comprado|fabricado`), `saleType` → artístico si `affectsDailySales === false`.
- `visible`, `status`, `colors[]`, `sizes[]`, relación `image`.

### 4.2 Venta (campos críticos)

- `number` autoincremental, `branch`, `seller`, `status`, `lines[]`, `payments[]`, `returns[]`.
- Calculados en hook: `subtotal`, `discountTotal`, `total`, `artisticTotal`, `reportableTotal`.
- Analítica usa **solo** `reportableTotal` y líneas con `affectsSales !== false`.

### 4.3 Movimiento inventario

Tipos: `entrada_compra`, `venta`, `ajuste_positivo`, `ajuste_negativo`, `merma`, `devolucion`, `anulacion`, `traslado_entrada`, `traslado_salida`.

Hook `beforeChange` actualiza `inventory` y setea `balanceAfter`, `actor`.

---

## 5. Flujos operativos

### 5.1 Venta (POS / ventas)

1. Selección productos, cliente opcional, descuentos (tope empleado 10%).
2. Pagos deben igualar `total`.
3. Create `sales` → hook descuenta inventario (`venta`), registra líneas.
4. Devolución parcial → `returns` en venta; analítica resta unidades/valor.

**Backend:** endpoint de venta debe ser transaccional (stock, numeración, pagos).

### 5.2 Inventario

| Flujo | UI | Server Action |
|-------|-----|---------------|
| Entrada manual | `inventario?tab=entrada` | `registerEntry` |
| Código de barras | acumula lecturas → commit | `registerBulkEntries` |
| Carga rápida texto | parse `SKU - QTY - cost` | `registerBulkEntries` |
| Ajuste/merma | tab ajuste | `registerAdjustment` |
| Traslado | tab traslado | `transferStock` (compensación si falla) |

Resolución código: match `sku`, `barcode` o `id` (case insensitive).

Proveedor **obligatorio** si `product.origin !== 'fabricado'`.

### 5.3 Caja

- Movimientos por categoría; transferencias se bloquean (`locked`).
- Empleado: solo movimientos propios abiertos (sin cierre).
- Cierre: módulo `cierre` consolida día.

### 5.4 Analítica

**Estado demo:**

- Sin `?procesar=1`: UI muestra `buildEmptyReport()` (ceros).
- Con `?procesar=1`: `buildReport()` agrega en memoria desde Payload (`overrideAccess` tras chequeo permiso `analitica`).

**Contrato backend propuesto:**

| Paso | Front | Backend futuro |
|------|-------|----------------|
| 1 | Usuario elige sede + rango | Igual |
| 2 | Clic **Procesar analítica** | `POST /analytics/jobs` dispara ETL |
| 3 | Poll o webhook | Materializa agregados (tablas OLAP o JSON cache) |
| 4 | Front lee snapshot | `GET /analytics/report?...` |
| 5 | PDF | `GET /analytics/report.pdf?...` |

Query param actual: `procesar=1` (ver `ANALYTICS_ETL_PARAM` en `analytics-shared.ts`).

**Métricas calculadas hoy (debe reproducir ETL):**

- Ventas netas normales, ticket, gastos, entregas, transferencias, ahorros, margen, ratio gastos.
- Buckets mensuales si rango es mes completo enero–diciembre o mes único.
- Rankings productos/categorías, devoluciones, artísticos separados.
- Inventario: entradas/salidas por bucket, bajo mínimo, rotación.
- Sitio: visitas, WA carrito/promo por promoción.

PDF: `GET /panel/{role}/reporte?procesar=1&desde&hasta&sede` → `renderReportPdf`.

### 5.5 Facturación / impresión

- `electronic-invoices` + ruta imprimir venta.
- Plantilla `invoice-print.tsx`.

### 5.6 Permisos

- UI oculta módulos; **backend no debe confiar en UI**.
- Server Actions usan `run()` con módulo y usuario Payload.

---

## 6. Server Actions principales

| Archivo | Acciones |
|---------|----------|
| `actions-inventory.ts` | `registerEntry`, `registerBulkEntries`, `registerAdjustment`, `transferStock` |
| `actions-sales.ts` | ventas, anulaciones, devoluciones |
| `actions-cash.ts` | movimientos, entregas |
| `actions-admin.ts` | usuarios, permisos |
| `actions-recovery.ts` | tokens recuperación |
| `login/actions.ts` | sesión app |

Patrón respuesta: `{ ok, message?, error? }` + `router.refresh()` en cliente.

---

## 7. Caché y revalidación

- Sitio: `unstable_cache` en `data.ts` con tags (`products`, `branches`, `promotions`, …).
- Hooks Payload llaman `revalidateTag` en cambios de catálogo/sedes.
- Panel: dinámico (`force-dynamic` implícito por cookies).

**Backend:** invalidar CDN/cache al publicar contenido si se replica lectura.

---

## 8. Integraciones externas

| Integración | Front | Backend |
|-------------|-------|---------|
| WhatsApp | enlaces `wa.me` con teléfono sede/settings | opcional API Business |
| Google Maps | embed sedes | — |
| Correo recuperación | `mailer.ts` | SMTP env vars |
| Código barras | HID teclado | opcional SDK cámara |

---

## 9. Seguridad

- Secrets solo server-side (`process.env`, no `NEXT_PUBLIC_*` para claves).
- `overrideAccess: false` en lecturas user-facing con `user` autenticado; analítica/reportes verifican permiso antes de `overrideAccess: true`.
- Formularios públicos: allowlist de campos en server.
- IDs: string | number según `payload-types.ts` — no asumir numéricos.

---

## 10. Despliegue

- Figma Make: `.figma/make/deploy`, `output: 'standalone'`.
- Imágenes: loader `figma-image-loader.ts`, `media.url` de Payload.
- Verificación: `figma make verify-deploy` + rutas públicas estáticas donde aplique.

Ver [DEPLOYMENT.md](./DEPLOYMENT.md).

---

## 11. Alineación checklist backend

- [ ] Auth JWT/sesión compatible con roles y sede usuario.
- [ ] CRUD maestros con mismos slugs y validaciones que hooks Payload.
- [ ] Ventas transaccionales con `reportableTotal` y artísticos separados.
- [ ] Kardex único vía movimientos (no update directo stock).
- [ ] ETL analítica materializa mismos campos que `Report` en `analytics.ts`.
- [ ] Endpoint PDF o generación server-side equivalente.
- [ ] Bulk inventario: aceptar array `{ productId, quantity, unitCost? }` + metadata común.
- [ ] Lookup producto por `sku` / `barcode`.
- [ ] Eventos sitio para métricas marketing.
- [ ] Permisos por módulo replicados en API Gateway.

---

## 12. Referencia de tipos

Tipos TS generados: `src/payload-types.ts`. Tipo agregado analítica: `Report` en `src/lib/analytics.ts`.

---

*Versión documento: 1.0.0-demo — 2026-10-26*
