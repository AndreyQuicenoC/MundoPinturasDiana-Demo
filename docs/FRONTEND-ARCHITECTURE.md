# Arquitectura funcional del frontend — Mundo Pinturas Diana (Demo mock)

Documento maestro para alinear un **backend futuro** con la demo visual actual. En despliegue Netlify/Vercel **no hay base de datos externa**: todo el contenido operativo vive en **`src/lib/demo/fixtures.ts`** y se sirve mediante **`mock-payload`** en memoria (`DEMO_MOCK=true`).

---

## 1. Resumen ejecutivo

| Capa | Tecnología | Responsabilidad |
|------|------------|-----------------|
| Sitio público | Next.js 16 App Router (RSC + client) | Catálogo, marketing, carrito → WhatsApp |
| Panel interno | Rutas `/panel/[role]/[module]` | ERP demo por rol (admin, gerente, empleado) |
| Datos demo | `mock-payload` + store en `globalThis` | Lecturas/escrituras simuladas sin PostgreSQL |
| Auth app | Cookie `app-session` + JWT (jose) | Login demo con 3 usuarios fijos |
| Figma Make (opcional) | `FIGMA=1` + `@payloadcms/figma` | Entorno original con Payload cloud |

**Zona horaria:** America/Bogotá (UTC−5) en caja, analítica y fechas mostradas.

**Persistencia en demo mock:** las mutaciones (ventas, entradas de inventario, etc.) actualizan el store **en memoria** del proceso serverless; pueden perderse entre invocaciones frías. Es aceptable para demostración.

---

## 2. Modo demo mock (Netlify / Vercel)

| Variable | Valor | Efecto |
|----------|--------|--------|
| `DEMO_MOCK` | `true` | Activa `mock-payload`, permisos solo matriz, build `next build` sin Payload DB |
| `PAYLOAD_SECRET` | ≥ 32 chars | Firma JWT de sesión demo |
| `NEXT_PUBLIC_SITE_URL` | URL pública | Enlaces absolutos e imagen loader |

Archivos clave:

- `src/lib/demo/env.ts` — `isDemoMock()`
- `src/lib/demo/fixtures.ts` — dataset inicial (usuarios, ventas ~12 meses, inventario, caja, sitio)
- `src/lib/demo/mock-payload.ts` — API compatible: `find`, `create`, `login`, `auth`, `findGlobal`
- `src/lib/payload.ts` — desvía a mock cuando `isDemoMock()`
- `next.config.ts` — sin `withPayload` en demo (bundle más liviano)

Build: `npm run build:demo` (Netlify: `netlify.toml`).

---

## 3. Actores, roles y matriz de módulos

### 3.1 Usuarios demo

| Rol | Email | Contraseña | Sede por defecto |
|-----|--------|------------|------------------|
| admin | admin@mundopinturasdiana.test | Admin#2026demo | Cali Centro |
| gerente | gerente@mundopinturasdiana.test | Gerente#2026demo | Cali Centro |
| empleado | empleado@mundopinturasdiana.test | Empleado#2026demo | Cali Centro |

### 3.2 Modos de permiso

| Modo | Significado en UI |
|------|-------------------|
| `total` | Ver y escribir |
| `ver` | Solo lectura |
| `propio` | Solo registros propios (p. ej. ventas del vendedor) |
| `none` | Módulo oculto / redirect |

### 3.3 Matriz por defecto (`src/lib/access.ts`)

| Módulo | admin | gerente | empleado |
|--------|-------|---------|----------|
| resumen | total | total | propio |
| usuarios | total | none | none |
| permisos | total | none | none |
| sedes | total | none | none |
| categorias | total | none | none |
| productos | total | total | ver |
| inventario | total | total | ver |
| clientes | total | total | total |
| proveedores | total | none | none |
| ventas | total | total | propio |
| pos | total | total | total |
| domicilios | total | total | total |
| facturacion | total | total | none |
| caja | total | total | none |
| conceptos | total | total | none |
| cierre | total | total | none |
| eventos | total | total | none |
| promociones | total | total | none |
| auditoria | total | none | none |
| analitica | total | total | none |
| cuenta | (todos) | (todos) | (todos) |

En producción real, `role-permissions` y `user-permissions` sobreescriben esta matriz; en **demo mock** solo aplica la matriz.

---

## 4. Mapa de rutas

### 4.1 Sitio público `(frontend)/(site)`

| Ruta | Tipo | Descripción | Fuente de datos |
|------|------|-------------|-----------------|
| `/` | SSG/ISR | Inicio, carruseles, promos | `getProducts`, `getPromotions`, `getBranches` |
| `/catalogo` | Estático + client | Listado y filtros | `getProducts` |
| `/catalogo/[slug]` | SSG | Ficha producto | `getProductBySlug` |
| `/carrito` | Estático | Carrito + WhatsApp | `getBranches`, estado cliente |
| `/sedes` | Cache 1h | Sedes y mapas | `getBranches` |
| `/sobre-nosotros` | Estático | Historia / equipo | Copy + imágenes |
| `/mapa-del-sitio` | Estático | Índice de páginas | Estático |
| `/login` | Dinámico | Acceso panel | `app-auth` |
| `/robots.txt`, `/sitemap.xml` | Meta | SEO | Generados |

Tracking: `POST /api/track` → incrementa `site-events` (visit, whatsapp_cart, whatsapp_promo).

### 4.2 Panel `(frontend)/(app)/panel`

| Ruta | Descripción |
|------|-------------|
| `/panel` | Redirección según sesión |
| `/panel/[role]` | **Resumen** (KPIs del día, alertas stock, notificaciones) |
| `/panel/[role]/[module]` | Módulo CRUD o especializado |
| `/panel/[role]/cuenta` | Mi cuenta (query implícita vía `module=cuenta` en page) |
| `/panel/[role]/reporte` | PDF analítica (GET, `procesar=1`) |
| `/panel/[role]/imprimir/[id]` | Impresión venta / factura |

Módulos registrados en `REGISTRY` (`panel/[role]/[module]/page.tsx`).

---

## 5. Páginas del panel por rol (navegación efectiva)

Lo que ve cada rol es la intersección **matriz de permisos** + ítems en `PanelShell` (generados en layout según `effectiveForUser`).

### 5.1 Administrador

Acceso completo excepto restricciones de negocio (p. ej. empleado no ve caja). Puede: usuarios, permisos, sedes, categorías, productos, inventario (escritura), clientes, proveedores, ventas, POS, domicilios, facturación, caja, conceptos, cierre, eventos, promociones, auditoría, analítica.

### 5.2 Gerente

Operación diaria sin administración de usuarios/sedes/categorías/proveedores/auditoría. Escritura en productos, inventario, clientes, ventas, POS, domicilios, facturación, caja, conceptos, cierre, eventos, promociones, analítica.

### 5.3 Empleado

Enfoque mostrador: **POS**, **clientes**, **domicilios**, consulta **productos/inventario**, **ventas propias** en resumen y ventas. Sin caja, cierre, facturación electrónica, analítica, promociones, eventos (según matriz).

---

## 6. Tablas y grids por módulo (UI)

### 6.1 Recursos genéricos (`resource-module.tsx` + `panel-config.ts`)

Columnas definidas en `RESOURCES`:

| Módulo | Columnas de tabla |
|--------|-------------------|
| **usuarios** | Nombre, Correo, Rol, Estado, Sede |
| **sedes** | Orden, Nombre, Dirección, WhatsApp, Activa |
| **productos** | Imagen, SKU, Producto, Categoría, Precio, Visible, Estado |
| **clientes** | Nombre, Documento, Teléfono, Tipo, Habeas Data |
| **proveedores** | Nombre, NIT, Contacto, Teléfono |
| **domicilios** | Cliente, Dirección, Domiciliario, Pago domiciliario, Estado |
| **eventos** | Imagen, Evento, Inicio, Fin, Estado, Importancia, Tipo, Público |
| **categorias** | Nombre, Carrusel inicio, Activa |
| **conceptos** | Concepto, Categoría, Valor sugerido, Activo |
| **promociones** | Imagen, Título, Hashtags, Inicia, Termina, Estado, Clics WA |
| **auditoria** | Cuándo, Usuario, Módulo, Acción, Detalle |

Formularios: mismos campos que `fields` en `RESOURCES` (texto, relación, checkbox, tags, imagen+URL).

### 6.2 Inventario (`inventory-module.tsx`)

**Pestaña Existencias**

| Columna | Contenido |
|---------|-----------|
| Producto | Nombre + SKU |
| Origen | Comprado / Fabricado |
| Por sede | Cantidad (alerta Bajo/Agotado) |
| Total | Suma sedes visibles |
| Mínimo | Umbral |

**Pestaña Historial (Kardex)**

| Columna | Contenido |
|---------|-----------|
| Fecha | Timestamp |
| Producto, Sede, Tipo | Badge tipo movimiento |
| Cant., Anterior, Nuevo | Delta color |
| Costo, Proveedor, Referencia, Responsable | |

**Pestaña Registrar entrada** — tres modos:

1. **Manual** — producto, cantidad, costo, proveedor, documento, observaciones.
2. **Código de barras** — sede, proveedor, escaneo SKU/barcode, tabla acumulada, commit bulk.
3. **Carga rápida** — texto `SKU - CANTIDAD - costo` (coma o línea), preview, commit bulk.

**Ajuste / merma** y **Traslado** — formularios dedicados.

### 6.3 Ventas / POS / Caja / Cierre / Facturación

| Módulo | UI principal |
|--------|----------------|
| **ventas** | Tabla ventas, filtros, detalle, anulación/devolución (`sales-module`) |
| **pos** | Carrito POS, pagos múltiples, cliente, domicilio (`pos-module`) |
| **caja** | Movimientos del día, categorías, conceptos (`cash-module`) |
| **cierre** | Tabla: Día, Sede, Base, Entrega, Esperado, Contado, Diferencia, Estado |
| **facturacion** | Facturas electrónicas pendientes/generadas (`facturacion-module`) |
| **domicilios** | CRUD domicilios + estados ruta |

### 6.4 Permisos (`permissions-module.tsx`)

| Vista | Columnas |
|-------|----------|
| Por rol | Módulo × (admin, gerente, empleado) toggles |
| Por usuario | Módulo, Acceso actual, Permiso |

### 6.5 Analítica (`analitica.tsx` + `analytics/parts.tsx`)

| Sección | Componentes |
|---------|-------------|
| Filtros | Sede, Desde, Hasta, Atajos, PDF (tras procesar) |
| ETL | Banner **Procesar analítica** (`?procesar=1`) — sin procesar KPIs en 0 |
| KPIs | 9 tarjetas (ventas, ticket, gastos, margen, etc.) |
| Tabla mensual | Ventas, Nº, Ticket, Gastos, Entregas, Transf., Ahorros, Margen, Ratio |
| Gráficos | Ventas/gastos, cambio %, dona categorías, barras productos, sitio, inventario, devoluciones, artísticos |

### 6.6 Resumen (`panel/[role]/page.tsx`)

| Bloque | Contenido |
|--------|-----------|
| Hero | Saludo, acceso POS |
| KPIs | Ventas hoy, bajo stock, domicilios pendientes, FE pendientes (según rol) |
| Alertas inventario | Lista producto · sede · qty |
| Notificaciones | Lista reciente |

---

## 7. Modelo lógico de datos (entidades mock)

Equivalente a colecciones Payload; todas en `fixtures.ts` / store mutable.

| Entidad | Slug lógico | Uso principal |
|---------|-------------|---------------|
| Usuario app | `users` | Login panel |
| Sede | `branches` | Ventas, stock, caja, sitio |
| Categoría producto | `product-categories` | Catálogo, analítica |
| Tipo producto | `product-types` | Normal vs artístico |
| Producto | `products` | Catálogo, POS, inventario |
| Cliente | `clients` | Ventas, Habeas Data |
| Proveedor | `suppliers` | Entradas inventario |
| Inventario | `inventory` | Saldos por sede |
| Movimiento inventario | `inventory-movements` | Kardex |
| Venta | `sales` | POS, analítica, resumen |
| Movimiento caja | `cash-movements` | Caja, analítica |
| Concepto caja | `cash-concepts` | Plantillas gasto |
| Categoría caja | `cash-categories` | Clasificación gastos |
| Entrega efectivo | `cash-deliveries` | Analítica |
| Cierre caja | `cash-closings` | Cierre módulo |
| Cuenta banco | `bank-accounts` | Transferencias venta |
| Factura electrónica | `electronic-invoices` | Facturación |
| Domicilio | `domicilios` | Logística |
| Mensajero | `couriers` | Domicilios |
| Promoción | `promotions` | Sitio + analítica WA |
| Evento negocio | `events` | Calendario / sitio |
| Evento sitio | `site-events` | Visitas, clics WA |
| Auditoría | `audit-logs` | Módulo auditoría |
| Notificación | `notifications` | Campana resumen |
| Permiso rol | `role-permissions` | (vacío en demo) |
| Permiso usuario | `user-permissions` | (vacío en demo) |
| Global sitio | `site-settings` | WhatsApp, dirección, redes |
| Media | `media` | Imágenes (demo usa `imageUrl` estático) |

### 7.1 Producto (campos UI relevantes)

`name`, `sku`, `barcode`, `slug`, `salePrice`, `costPrice`, `minimumStock`, `origin`, `saleType`, `productCategory`, `visible`, `featured`, `status`, `colors[]`, `sizes[]`, `imageUrl`.

### 7.2 Venta

`number`, `branch`, `seller`, `status`, `lines[]`, `payments[]`, `returns[]`, `subtotal`, `discountTotal`, `total`, `artisticTotal`, `reportableTotal`, `createdAt`.

### 7.3 Movimiento inventario

Tipos: `entrada_compra`, `venta`, `ajuste_positivo`, `ajuste_negativo`, `merma`, `devolucion`, `anulacion`, `traslado_entrada`, `traslado_salida`. Mock aplica signo al saldo en `inventory`.

---

## 8. Flujos funcionales (paso a paso)

### 8.1 Login panel

1. `GET /login` → formulario.
2. Server Action valida email/password (mock: comparación en claro en store).
3. JWT en cookie `app-session`.
4. Redirect `/panel/{role}`.

### 8.2 POS / venta

1. Módulo POS: búsqueda producto, cantidades, descuentos (empleado máx. 10%).
2. Pagos deben igualar total; artísticos calculan `artisticTotal`.
3. Server Action crea `sales` (+ movimientos inventario en backend real; mock puede ampliarse).
4. Opción imprimir `/panel/.../imprimir/[id]`.

### 8.3 Inventario — entrada manual

1. Tab entrada → modo Manual.
2. `registerEntry` → `inventory-movements` tipo `entrada_compra`.
3. Mock actualiza saldo y kardex.

### 8.4 Inventario — código de barras

1. Modo Barcode: foco en input; lector USB envía SKU + Enter.
2. Resolución por `sku`, `barcode` o id.
3. Tabla acumula cantidades por producto.
4. `registerBulkEntries` al confirmar.

### 8.5 Inventario — carga rápida

1. Pegar texto `SKU - CANTIDAD - costo` separado por comas o líneas.
2. `parseBulkInventoryText` valida.
3. `registerBulkEntries` con documento/observaciones comunes.

### 8.6 Analítica

1. Entrada: KPIs y gráficos en **cero**.
2. Usuario pulsa **Procesar analítica** → `?procesar=1`.
3. `buildReport` agrega ventas/caja/inventario/sitio del mock (~300+ ventas/año en fixtures).
4. PDF: `GET .../reporte?procesar=1&desde&hasta&sede` → `renderReportPdf`.

### 8.7 Carrito público

1. Cliente agrega productos (estado React).
2. Elige sede → mensaje WhatsApp con líneas.

### 8.8 Permisos (admin)

1. Matriz rol / overrides usuario.
2. En demo mock los toggles pueden persistir en store si se implementan actions; por defecto matriz fija.

### 8.9 Cierre de jornada

1. Comparación base + movimientos vs conteo físico.
2. Tabla histórica cierres.

### 8.10 Facturación electrónica

1. Lista documentos pendientes/generados.
2. Flujo generación (demo).

---

## 9. Server Actions y APIs

| Área | Archivo | Acciones |
|------|---------|----------|
| Login | `login/actions.ts` | login, logout |
| Inventario | `actions-inventory.ts` | `registerEntry`, `registerBulkEntries`, `registerAdjustment`, `transferStock` |
| Ventas | `actions-sales.ts` | crear, anular, devoluciones |
| Caja | `actions-cash.ts` | movimientos, entregas |
| Admin | `actions-admin.ts` | usuarios, permisos |
| Recuperación | `actions-recovery.ts` | tokens (demo) |
| Kit | `action-kit.ts` | `guard`, `run`, permisos |
| Track | `api/track/route.ts` | eventos sitio |
| PDF | `panel/.../reporte/route.ts` | informe analítica |

Todas las mutaciones pasan por `run(module, fn)` con chequeo de permiso.

---

## 10. Sitio público — componentes

| Componente | Función |
|------------|---------|
| `site-header` / `site-footer` | Nav, contacto |
| `product-carousel` | Destacados |
| `promotions-section` | Promos activas |
| `catalog-client` | Filtros catálogo |
| `product-card` | Tarjeta producto |
| `cart-provider` / `cart-client` | Carrito |
| `visit-tracker` | POST track visita |
| `branch-card` | Sede + mapa |

---

## 11. Contrato backend futuro (cuando deje de ser mock)

| Capacidad demo | Endpoint / servicio sugerido |
|----------------|------------------------------|
| Auth JWT | `POST /auth/login`, cookie o Bearer |
| CRUD maestros | REST/GraphQL alineado a slugs arriba |
| Ventas transaccionales | `POST /sales` con inventario y pagos atómicos |
| Kardex | Solo vía movimientos, nunca update directo stock |
| Analítica | `POST /analytics/jobs` (ETL) + `GET /analytics/report` |
| PDF | `GET /analytics/report.pdf` |
| Bulk inventario | `POST /inventory/bulk` |
| Lookup barcode | `GET /products?barcode=` |
| Site events | `POST /telemetry` |

Campos calculados a preservar: `reportableTotal`, `artisticTotal`, `balanceAfter`, márgenes analítica.

---

## 12. Despliegue demo

- **Netlify:** `netlify.toml` → `npm run build:demo`, `DEMO_MOCK=true`, plugin Next.js.
- **Sin** `DATABASE_URI`.
- Usuarios demo en §3.1.

---

## 13. Checklist de paridad front ↔ backend

- [ ] Misma matriz de módulos y modos
- [ ] Mismos slugs de entidades y campos calculados en ventas
- [ ] Kardex por movimientos
- [ ] Analítica bajo demanda (ETL), no precargada en UI
- [ ] Tres modos entrada inventario
- [ ] Separación productos artísticos en reportes
- [ ] Eventos sitio para métricas marketing
- [ ] Zona horaria Bogotá en agregaciones

---

## 14. Catálogo de módulos del panel (21 claves)

Cada módulo vive en `/panel/{admin|gerente|empleado}/{module}`. La ruta **`cuenta`** no está en `MODULES` pero existe como `/panel/{role}/cuenta`.

| Clave | Etiqueta UI | Componente | Colección mock | Tipo de pantalla |
|-------|-------------|------------|----------------|------------------|
| `resumen` | Resumen | `panel/[role]/page.tsx` | varias | Dashboard KPIs |
| `usuarios` | Usuarios | `usuarios.tsx` → CRUD | `users` | Tabla + formulario |
| `permisos` | Permisos | `permisos.tsx` | `role-permissions`, `user-permissions` | Matrices |
| `sedes` | Sedes | `sedes.tsx` | `branches` | CRUD |
| `categorias` | Categorías | `categorias.tsx` | `product-categories` | CRUD |
| `productos` | Productos | `productos.tsx` | `products` | CRUD + imagen |
| `inventario` | Inventario | `inventario.tsx` | `inventory`, `inventory-movements` | Pestañas especializadas |
| `clientes` | Clientes | `clientes.tsx` | `clients` | CRUD Habeas Data |
| `proveedores` | Proveedores | `proveedores.tsx` | `suppliers` | CRUD |
| `ventas` | Ventas | `ventas.tsx` + `SalesModule` | `sales` | Lista acordeón + filtros |
| `pos` | Punto de venta | `pos.tsx` + `PosModule` | `sales` (create) | Carrito operativo |
| `domicilios` | Domicilios | `domicilios.tsx` | `domicilios` | CRUD |
| `facturacion` | Factura electrónica | `facturacion.tsx` | `electronic-invoices` | Cola FE |
| `caja` | Caja | `caja.tsx` + `CashModule` | `cash-movements` | Form + lista jornada |
| `conceptos` | Conceptos de caja | `conceptos.tsx` | `cash-concepts` | CRUD |
| `cierre` | Cierre de caja | `cierre.tsx` | `cash-closings` | Histórico cierres |
| `eventos` | Eventos | `eventos.tsx` | `events` | CRUD + pestañas vigentes |
| `promociones` | Promociones | `promociones.tsx` | `promotions` | CRUD + pestañas vigentes |
| `auditoria` | Auditoría | `auditoria.tsx` | `audit-logs` | Solo lectura + filtro acción |
| `analitica` | Analítica | `analitica.tsx` | agregaciones | ETL + gráficos + PDF |

---

## 15. Rutas efectivas por tipo de usuario

Leyenda: **T** = total (CRUD), **V** = ver, **P** = propio, **—** = sin acceso (redirect a resumen).

| Módulo | Admin | Gerente | Empleado |
|--------|-------|---------|----------|
| resumen | T | T | P (solo sus KPIs del día) |
| usuarios | T | — | — |
| permisos | T | — | — |
| sedes | T | — | — |
| categorias | T | — | — |
| productos | T | T | V |
| inventario | T | T | V |
| clientes | T | T | T |
| proveedores | T | — | — |
| ventas | T | T | P (solo ventas de hoy propias) |
| pos | T | T | T |
| domicilios | T | T | T |
| facturacion | T | T | — |
| caja | T | T | — |
| conceptos | T | T | — |
| cierre | T | T | — |
| eventos | T | T | — |
| promociones | T | T | — |
| auditoria | T | — | — |
| analitica | T | T | — |
| cuenta | T | T | T |

**Empleado en ventas:** filtros fijos `seller = yo` y `createdAt >= inicio del día (Bogotá)`; sin estadísticas mensuales ni anulación global salvo permiso `total`.

**Admin bloqueado:** `LOCKED_FOR_ADMIN` impide revocar `resumen`, `permisos`, `usuarios` al rol admin.

---

## 16. Tablas y columnas — módulos especializados

### 16.1 Ventas (`SalesModule`)

**Tarjetas superiores (admin/gerente):** Ventas del mes (COP, sin anuladas ni artísticos), Devoluciones del mes.

**Filtros GET:** `mes`, `branch`, `estado`, `desde`, `hasta`; paginación `page`.

**Fila lista (acordeón):** `#número`, fecha/hora, vendedor, badge estado, total COP.

**Detalle expandido:** tabla líneas (producto, color/tamaño, badge artístico, cant × precio, descuento %, total línea); pagos (método, monto, cuenta banco); domicilio; FE solicitada; devoluciones; motivo anulación.

**Acciones:** Imprimir (`/imprimir/[id]`), devolución parcial, anular (modal motivo).

### 16.2 Punto de venta (`PosModule`)

- Buscador productos (SKU/nombre), carrito con cantidades, color/tamaño cuando aplica.
- Cliente opcional (relación `clients`), domicilio embebido.
- Pagos múltiples: efectivo, tarjeta, transferencia (cuenta `bank-accounts`).
- Descuento por línea; tope descuento empleado 10 %.
- Productos artísticos: líneas con `affectsSales: false` → `artisticTotal`.
- Confirmación → crea documento `sales` + movimientos inventario en backend real; mock registra venta y puede descontar stock.

### 16.3 Caja (`CashModule`)

**Resumen jornada:** ventas efectivo/tarjeta/transferencia, adiciones, gastos, ahorros, transferencias, conteo ventas, cierre bloqueado, efectivo esperado.

**Formulario movimiento:** sede, concepto (combobox precarga categoría/monto/detalle), categoría (gasto | transferencia | ahorro | adición base), valor, detalle.

**Lista movimientos:** hora, concepto, categoría chip, usuario, monto con signo, editar/borrar si no `locked` y permiso.

### 16.4 Cierre (`cierre.tsx`)

Columnas típicas: día, sede, base inicial, entrega efectivo, esperado, contado físico, diferencia, estado (abierto/cerrado), responsable.

### 16.5 Facturación (`facturacion-module`)

Lista facturas electrónicas: venta origen, cliente/NIT, estado (pendiente, generada, error), CUFE/CUDE cuando exista, acciones generar/reintentar (demo).

### 16.6 Inventario — pestañas URL `?tab=`

| tab | Quién escribe | Función |
|-----|---------------|---------|
| `existencias` | todos con acceso | Grid saldos |
| `historial` | todos | Kardex paginado |
| `entrada` | total | Manual / barcode / bulk |
| `ajuste` | total | Ajuste ± / merma |
| `traslado` | total | Origen → destino sede |

---

## 17. Enumeración de funcionalidades (checklist producto)

### Sitio público

1. Home con productos destacados y categorías en carrusel.
2. Catálogo con búsqueda, categoría, visibilidad solo productos activos/visibles.
3. Ficha producto por slug (`generateStaticParams` desde mock).
4. Selector colores/tamaños en ficha cuando el producto los define.
5. Carrito local (React context), cantidades, total.
6. Envío pedido vía WhatsApp con sede elegida y líneas formateadas.
7. Sedes con mapa/enlace Google Maps y horarios.
8. Promociones activas con clic WA contabilizado en `site-events`.
9. Eventos públicos visibles en calendario/sitio.
10. Sobre nosotros, mapa del sitio, robots/sitemap.
11. Telemetría: visita página, clic carrito WA, clic promo WA.

### Panel — transversal

12. Login/logout con JWT en cookie httpOnly.
13. Shell con navegación lateral filtrada por permisos efectivos.
14. Redirección si `role` en URL ≠ rol del usuario.
15. Mi cuenta: datos personales, contacto emergencia, cambio contraseña.
16. Impresión comprobante venta (formato carta/ticket según query).
17. Paginación 15 ítems, búsqueda `?q=` en CRUD genéricos.
18. Auditoría append-only en acciones sensibles (cuando se registra en mock).

### Panel — inventario y catálogo

19. CRUD productos con imagen URL, colores, tamaños, stock mínimo.
20. CRUD categorías con flag carrusel inicio.
21. Entrada compra manual con proveedor y documento soporte.
22. Escaneo barras acumulativo multi-SKU.
23. Parseo carga rápida texto masivo.
24. Ajustes positivos/negativos y merma con motivo.
25. Traslados entre sedes (par entrada/salida).
26. Alertas bajo stock en resumen.

### Panel — ventas y dinero

27. POS multi-pago y multi-línea.
28. Separación contable productos artísticos.
29. Listado ventas con anulación y devolución parcial.
30. Estadísticas mes ventas/devoluciones (roles gerencia).
31. Movimientos caja categorizados.
32. Conceptos precargados para gastos frecuentes.
33. Cierre con cuadre y diferencia.
34. Domicilios desacoplados de venta (fee mensajero).
35. Cola facturación electrónica demo.

### Panel — gobierno

36. CRUD usuarios app (solo admin).
37. Matriz permisos por rol y overrides por usuario.
38. CRUD sedes (impacto sitio y operación).
39. CRUD proveedores.
40. Log auditoría filtrable por acción.

### Analítica

41. Filtros sede + rango fechas + atajos mes.
42. Simulación ETL: sin `procesar=1` todo en cero.
43. KPIs: ventas reportables, ticket, transacciones, gastos, margen, ratio, etc.
44. Tabla mensual comparativa.
45. Gráficos: tendencia, categorías, top productos, sitio, inventario, devoluciones, línea artística.
46. Export PDF informe ejecutivo.

---

## 18. Campos de formulario CRUD (referencia `panel-config.ts`)

Además de las columnas ya listadas en §6.1, los formularios incluyen:

- **Usuarios:** documento, teléfono, contraseña solo en alta.
- **Sedes:** ciudad, teléfono, horario, mapsUrl, mapQuery, orden.
- **Productos:** marca, tipo venta, origen, línea, unidad, IVA %, descripción, featured.
- **Clientes:** dirección, email, notas, activo.
- **Proveedores:** email, textarea productos que suministra.
- **Domicilios:** notas, estados logísticos.
- **Eventos:** impacto, áreas afectadas, sede opcional.
- **Categorías:** homeOrder.
- **Conceptos:** description sugerida en movimiento caja.
- **Promociones:** kind promoción/sorteo, hashtags obligatorios.

Módulos **sin** entrada en `RESOURCES` (UI custom): inventario, ventas, pos, caja, cierre, facturacion, permisos, analitica, resumen, cuenta.

---

## 19. Fixtures demo (`fixtures.ts`) — volumen orientativo

| Dataset | Propósito demo |
|---------|----------------|
| 3 usuarios | Login por rol |
| 2–3 sedes | Filtros sede, mapas |
| Categorías + tipos | Catálogo y analítica por categoría |
| ~15+ productos | POS, barras, catálogo SSG |
| Clientes/proveedores | Relaciones formularios |
| Saldos inventario + movimientos seed | Kardex inicial |
| Ventas ~12 meses | Analítica tras procesar |
| Movimientos caja, entregas | KPIs financieros |
| Promos/eventos activos | Home público |
| site-events | Gráfico marketing |
| Notificaciones | Campana resumen |
| Global site-settings | WhatsApp footer |

Al reiniciar cold start en Netlify, el store vuelve a este snapshot; las mutaciones de la sesión anterior no se garantizan.

---

## 20. Glosario

| Término | Significado en la demo |
|---------|------------------------|
| Reportable | Venta que entra en KPIs excluyendo líneas artísticas |
| Artístico | Línea que no suma a ventas reportables pero sí a `artisticTotal` |
| Procesar analítica | Flag ETL client-side/server read que ejecuta `buildReport` |
| Mock-payload | Sustituto de `getPayload()` con API reducida |
| Modo propio | Filtro automático por `seller` o usuario dueño |
| Kardex | Lista cronológica `inventory-movements` |

---

*Versión: 1.2.0-demo mock — 2026-10-26*
