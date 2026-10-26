# Design system — Mundo Pinturas Diana (UI / UX)

Guía de interfaz alineada con principios de **Material Design** (jerarquía, motion con propósito, accesibilidad) adaptada a la identidad de la demo: **plum**, **magenta**, **cyan** y **sun**.

## 1. Principios UX

1. **Claridad operativa** — El panel prioriza tareas frecuentes (vender, registrar entrada, cerrar caja) con una sola acción primaria por pantalla.
2. **Feedback inmediato** — Toasts para acciones, estados `pending` en botones, badges de estado y alertas de stock bajo.
3. **Progressive disclosure** — Filtros en URL, pestañas por módulo, modales/`dialog` para confirmaciones; analítica pesada solo tras procesamiento explícito.
4. **Accesibilidad** — Contraste AA en textos principales, `aria-label` en iconos, foco visible (`focus:border-cyan`), soporte teclado en combobox y escaneo.
5. **Responsive** — Tablas con scroll horizontal; grids `sm:` / `lg:`; panel usable en tablet.

## 2. Identidad visual

| Token | Uso |
|-------|-----|
| Plum `#4A154B` | Encabezados, navegación, énfasis de marca |
| Brand / Magenta `#E11D74` | CTAs primarios, series de ventas |
| Cyan `#00ACC1` | Confirmaciones, entradas, enlaces activos |
| Sun `#FFC93C` | Alertas, eventos clave, acentos |
| Paper `#FFFAF4` | Fondos suaves, filas alternas |
| Ink `#1B1220` | Texto principal |

Tipografía: **display** para títulos de módulo; **sans** para cuerpo; **mono** para montos tabulares y SKUs.

## 3. Componentes recurrentes

- **Botón primario**: fondo brand, sombra offset plum, hover `-translate-y-0.5`.
- **Botón ghost**: borde plum/20, hover `plum-soft`.
- **Tarjetas KPI**: borde `2px`, radio `2xl`, label en uppercase pequeño.
- **Tablas**: cabecera `plum-soft`, filas divididas, badges por tipo de movimiento.
- **Pestañas URL** (`UrlTabs`): estado en query string para compartir vistas.
- **Modal (`dialog`)**: backdrop blur, sombra dura, cierre con X y clic fuera.
- **Combobox**: búsqueda con teclado para catálogos largos.
- **Tooltips**: `title` en controles críticos; componente global donde aplique.

## 4. Patrones por área

### Sitio público

- Hero con carrusel de productos insignia.
- Catálogo con filtros cliente, fichas con color/tamaño.
- Carrito → WhatsApp con sede seleccionada.
- Promociones con CTA medible (`site-events`).

### Panel

- **Shell** lateral con módulos filtrados por permiso.
- **Recursos CRUD** genéricos (`resource-module`) para maestros.
- **POS / Ventas** flujos guiados con validación de pagos.
- **Inventario** tres modos de entrada con misma metadata (sede, proveedor, documento).
- **Analítica** banner ETL + nota de última actualización.

## 5. Iconografía

Usar **Lucide React** (sin emojis en UI operativa): `Search`, `Download`, `Barcode`, `Cpu`, `AlertTriangle`, etc.

## 6. Motion

- Transiciones cortas (`transition`) en hover de botones y enlaces.
- `Loader2` animado en envíos async.
- Decoración del login: blobs flotantes (solo marketing).

## 7. Formularios

- Labels semibold, inputs `rounded-xl`, borde `plum/15`, foco cyan.
- Errores de servidor vía toast; validación HTML5 mínima en cliente.
- Campos sensibles (costo) restringidos por rol en Payload, no solo en UI.

## 8. Checklist de revisión visual

- [ ] ¿Hay una acción primaria clara?
- [ ] ¿Los estados vacíos explican el siguiente paso?
- [ ] ¿Tablas legibles en móvil (scroll)?
- [ ] ¿Iconos con etiqueta accesible?
- [ ] ¿Colores de estado consistentes con leyenda?
