import type { ModuleKey } from './access'

export type Col = { key: string; label: string; kind?: 'text' | 'money' | 'date' | 'datetime' | 'badge' | 'bool' | 'num' | 'thumb' | 'tags'; alt?: string }
export type FieldDef = {
  name: string
  label: string
  type: 'text' | 'email' | 'number' | 'textarea' | 'select' | 'checkbox' | 'relation' | 'password' | 'date' | 'image' | 'array' | 'tags'
  /** image: nombre del campo de texto alternativo (enlace). */
  urlField?: string
  /** array: sub-campos de cada elemento. */
  items?: { name: string; label: string; type: 'text' | 'color' }[]
  /** relation: lista con buscador. */
  searchable?: boolean
  wide?: boolean
  options?: string[]
  relation?: string
  required?: boolean
  createOnly?: boolean
  help?: string
}
export type ResourceCfg = {
  collection: string
  title: string
  singular: string
  blurb: string
  cols: Col[]
  fields: FieldDef[]
  sort?: string
  noCreate?: boolean
  noDelete?: boolean
  searchField?: string
  searchFields?: string[]
}

const bool = (name: string, label: string): FieldDef => ({ name, label, type: 'checkbox' })

export const RESOURCES: Partial<Record<ModuleKey, ResourceCfg>> = {
  usuarios: {
    collection: 'users', title: 'Usuarios', singular: 'usuario', blurb: 'Personal con acceso al sistema. Los usuarios se crean aquí; no hay registro público.',
    searchField: 'name', searchFields: ['name', 'email'], sort: 'name',
    cols: [{ key: 'name', label: 'Nombre' }, { key: 'email', label: 'Correo' }, { key: 'role', label: 'Rol', kind: 'badge' }, { key: 'status', label: 'Estado', kind: 'badge' }, { key: 'branch', label: 'Sede' }],
    fields: [
      { name: 'name', label: 'Nombre completo', type: 'text', required: true },
      { name: 'email', label: 'Correo', type: 'email', required: true },
      { name: 'password', label: 'Contraseña inicial (mín. 8 caracteres)', type: 'password', required: true, createOnly: true },
      { name: 'document', label: 'Documento', type: 'text' },
      { name: 'phone', label: 'Teléfono', type: 'text' },
      { name: 'role', label: 'Rol', type: 'select', options: ['admin', 'gerente', 'empleado'], required: true },
      { name: 'status', label: 'Estado', type: 'select', options: ['activo', 'inactivo', 'bloqueado'], required: true },
      { name: 'branch', label: 'Sede', type: 'relation', relation: 'branches' },
    ],
  },
  sedes: {
    collection: 'branches', title: 'Sedes', singular: 'sede', blurb: 'Puntos de venta. Alimentan el sitio público y los pedidos por WhatsApp.', searchField: 'name', sort: 'order',
    cols: [{ key: 'order', label: 'Orden' }, { key: 'name', label: 'Nombre' }, { key: 'address', label: 'Dirección' }, { key: 'whatsapp', label: 'WhatsApp' }, { key: 'active', label: 'Activa', kind: 'bool' }],
    fields: [
      { name: 'name', label: 'Nombre', type: 'text', required: true },
      { name: 'address', label: 'Dirección', type: 'text', required: true },
      { name: 'city', label: 'Ciudad', type: 'text' },
      { name: 'phone', label: 'Teléfono', type: 'text' },
      { name: 'whatsapp', label: 'WhatsApp (solo dígitos con indicativo)', type: 'text' },
      { name: 'schedule', label: 'Horario', type: 'text' },
      { name: 'mapsUrl', label: 'Ubicación en Google Maps (enlace o enlace de inserción)', type: 'text', wide: true },
      { name: 'mapQuery', label: 'Texto para el mapa (alternativa)', type: 'text' },
      { name: 'order', label: 'Orden en el sitio', type: 'number' },
      bool('active', 'Sede activa'),
    ],
  },
  productos: {
    collection: 'products', title: 'Productos', singular: 'producto', blurb: 'Catálogo público y base del inventario. Cada cambio de precio queda en el historial.', searchField: 'name', searchFields: ['name', 'sku', 'brand', 'barcode'], sort: 'name',
    cols: [{ key: 'image', label: '', kind: 'thumb' }, { key: 'sku', label: 'SKU' }, { key: 'name', label: 'Producto' }, { key: 'productCategory', label: 'Categoría', alt: 'category' }, { key: 'salePrice', label: 'Precio', kind: 'money' }, { key: 'visible', label: 'Visible', kind: 'bool' }, { key: 'status', label: 'Estado', kind: 'badge' }],
    fields: [
      { name: 'name', label: 'Nombre', type: 'text', required: true },
      { name: 'sku', label: 'SKU / código', type: 'text', required: true },
      { name: 'barcode', label: 'Código de barras', type: 'text' },
      { name: 'brand', label: 'Marca', type: 'text' },
      { name: 'productCategory', label: 'Categoría', type: 'relation', relation: 'product-categories', searchable: true },
      { name: 'saleType', label: 'Tipo de producto', type: 'relation', relation: 'product-types' },
      { name: 'origin', label: 'Origen', type: 'select', options: ['comprado', 'fabricado'] },
      { name: 'productType', label: 'Línea (vinilo, esmalte, laca…)', type: 'text' },
      { name: 'unit', label: 'Unidad', type: 'select', options: ['unidad', 'cuarto', 'galon', 'cunete', 'litro', 'kilo', 'metro'] },
      { name: 'salePrice', label: 'Precio de venta (COP)', type: 'number', required: true },
      { name: 'costPrice', label: 'Costo (COP)', type: 'number' },
      { name: 'ivaPct', label: 'IVA % (opcional)', type: 'number' },
      { name: 'minimumStock', label: 'Stock mínimo', type: 'number' },
      { name: 'status', label: 'Estado', type: 'select', options: ['activo', 'inactivo', 'agotado'] },
      { name: 'description', label: 'Descripción', type: 'textarea' },
      { name: 'image', label: 'Imagen', type: 'image', urlField: 'imageUrl' },
      { name: 'colors', label: 'Colores predefinidos', type: 'array', items: [{ name: 'hex', label: 'Color', type: 'color' }, { name: 'name', label: 'Nombre', type: 'text' }] },
      { name: 'sizes', label: 'Tamaños disponibles', type: 'array', items: [{ name: 'label', label: 'Tamaño (ej. 1/4 gal, 5 gal)', type: 'text' }] },
      bool('visible', 'Visible en el catálogo público'),
      bool('featured', 'Producto insignia'),
    ],
  },
  clientes: {
    collection: 'clients', title: 'Clientes', singular: 'cliente', blurb: 'Datos personales tratados bajo Habeas Data (Ley 1581). Registra la autorización del titular.', searchField: 'name', searchFields: ['name', 'document', 'phone', 'email'], sort: 'name',
    cols: [{ key: 'name', label: 'Nombre' }, { key: 'document', label: 'Documento' }, { key: 'phone', label: 'Teléfono' }, { key: 'clientType', label: 'Tipo', kind: 'badge' }, { key: 'habeasData', label: 'Habeas Data', kind: 'bool' }],
    fields: [
      { name: 'name', label: 'Nombre', type: 'text', required: true },
      { name: 'document', label: 'Documento / NIT', type: 'text' },
      { name: 'phone', label: 'Teléfono', type: 'text' },
      { name: 'email', label: 'Correo', type: 'email' },
      { name: 'address', label: 'Dirección', type: 'text' },
      { name: 'clientType', label: 'Tipo de cliente', type: 'select', options: ['natural', 'empresa', 'pintor', 'contratista'] },
      bool('habeasData', 'Autoriza el tratamiento de sus datos (Habeas Data)'),
      { name: 'notes', label: 'Notas', type: 'textarea' },
      bool('active', 'Cliente activo'),
    ],
  },
  proveedores: {
    collection: 'suppliers', title: 'Proveedores', singular: 'proveedor', blurb: 'Quién nos surte y qué.', searchField: 'name',
    cols: [{ key: 'name', label: 'Nombre' }, { key: 'nit', label: 'NIT' }, { key: 'contact', label: 'Contacto' }, { key: 'phone', label: 'Teléfono' }],
    fields: [
      { name: 'name', label: 'Nombre', type: 'text', required: true },
      { name: 'nit', label: 'NIT', type: 'text' },
      { name: 'contact', label: 'Persona de contacto', type: 'text' },
      { name: 'phone', label: 'Teléfono', type: 'text' },
      { name: 'email', label: 'Correo', type: 'email' },
      { name: 'products', label: 'Qué nos suministra', type: 'textarea' },
      bool('active', 'Proveedor activo'),
    ],
  },
  domicilios: {
    collection: 'domicilios', title: 'Domicilios', singular: 'domicilio', blurb: 'El pago del domiciliario no entra en ventas ni en gastos del día.', searchField: 'customerName', sort: '-createdAt',
    cols: [{ key: 'customerName', label: 'Cliente' }, { key: 'address', label: 'Dirección' }, { key: 'courier', label: 'Domiciliario' }, { key: 'courierFee', label: 'Domiciliario $', kind: 'money' }, { key: 'status', label: 'Estado', kind: 'badge' }],
    fields: [
      { name: 'branch', label: 'Sede', type: 'relation', relation: 'branches', required: true },
      { name: 'customerName', label: 'Cliente', type: 'text', required: true },
      { name: 'phone', label: 'Teléfono', type: 'text', required: true },
      { name: 'address', label: 'Dirección de entrega', type: 'text', required: true },
      { name: 'courier', label: 'Domiciliario', type: 'text' },
      { name: 'courierFee', label: 'Pago al domiciliario (COP)', type: 'number' },
      { name: 'status', label: 'Estado', type: 'select', options: ['pendiente', 'en_ruta', 'entregado', 'cancelado'] },
      { name: 'notes', label: 'Notas', type: 'textarea' },
    ],
  },
  eventos: {
    collection: 'events', title: 'Eventos', singular: 'evento', blurb: 'Calendario: promociones, capacitaciones, entregas y fechas clave. Los marcados como visibles aparecen en el sitio público.', searchField: 'title', sort: '-startDate',
    cols: [{ key: 'image', label: '', kind: 'thumb' }, { key: 'title', label: 'Evento' }, { key: 'startDate', label: 'Inicio', kind: 'date' }, { key: 'endDate', label: 'Fin', kind: 'date' }, { key: '_estado', label: 'Estado', kind: 'badge' }, { key: 'importance', label: 'Importancia', kind: 'badge' }, { key: 'type', label: 'Tipo', kind: 'badge' }, { key: 'visible', label: 'Público', kind: 'bool' }],
    fields: [
      { name: 'title', label: 'Título', type: 'text', required: true },
      { name: 'type', label: 'Tipo', type: 'select', options: ['promocion', 'capacitacion', 'entrega', 'festivo', 'social', 'atipico', 'otro'] },
      { name: 'startDate', label: 'Inicio', type: 'date', required: true },
      { name: 'endDate', label: 'Fin', type: 'date', required: true },
      { name: 'importance', label: 'Importancia', type: 'select', options: ['normal', 'clave'], help: 'Clave = afecta datos u operación y se marca en la analítica.' },
      { name: 'branch', label: 'Sede (opcional)', type: 'relation', relation: 'branches' },
      { name: 'description', label: 'Descripción', type: 'textarea' },
      { name: 'impact', label: 'Impacto en la operación', type: 'textarea' },
      { name: 'affectedAreas', label: 'Áreas afectadas', type: 'text' },
      { name: 'image', label: 'Imagen', type: 'image', urlField: 'imageUrl' },
      bool('visible', 'Visible en el sitio público'),
      bool('active', 'Activo'),
    ],
  },
  categorias: {
    collection: 'product-categories', title: 'Categorías de producto', singular: 'categoría', blurb: 'Taxonomía que se elige en Productos y organiza el catálogo y los carruseles.', searchField: 'name', sort: 'name',
    cols: [{ key: 'name', label: 'Nombre' }, { key: 'showInHome', label: 'Carrusel en inicio', kind: 'bool' }, { key: 'active', label: 'Activa', kind: 'bool' }],
    fields: [
      { name: 'name', label: 'Nombre', type: 'text', required: true },
      { name: 'description', label: 'Descripción', type: 'textarea' },
      bool('showInHome', 'Mostrar como carrusel en el inicio'),
      { name: 'homeOrder', label: 'Orden en el inicio', type: 'number' },
      bool('active', 'Categoría activa'),
    ],
  },
  conceptos: {
    collection: 'cash-concepts', title: 'Conceptos de caja', singular: 'concepto', blurb: 'Ej.: «Pago a QUIMEX» (gasto). El valor y el detalle sugeridos son opcionales y precargan el movimiento en Caja.', searchField: 'name', sort: 'name',
    cols: [{ key: 'name', label: 'Concepto' }, { key: 'categoryRef', label: 'Categoría' }, { key: 'suggestedAmount', label: 'Valor sugerido', kind: 'money' }, { key: 'active', label: 'Activo', kind: 'bool' }],
    fields: [
      { name: 'name', label: 'Nombre del concepto', type: 'text', required: true },
      { name: 'categoryRef', label: 'Categoría', type: 'relation', relation: 'cash-categories', required: true },
      { name: 'suggestedAmount', label: 'Valor sugerido (opcional)', type: 'number' },
      { name: 'description', label: 'Detalle sugerido (opcional)', type: 'text' },
      bool('active', 'Concepto activo'),
    ],
  },
  promociones: {
    collection: 'promotions', title: 'Promociones y sorteos', singular: 'promoción', blurb: 'Se ven en el inicio hasta su fecha de fin; luego se archivan.', searchField: 'title', sort: 'endDate',
    cols: [{ key: 'image', label: '', kind: 'thumb' }, { key: 'title', label: 'Título' }, { key: 'hashtags', label: 'Hashtags', kind: 'tags' }, { key: 'startDate', label: 'Inicia', kind: 'date' }, { key: 'endDate', label: 'Termina', kind: 'date' }, { key: '_estado', label: 'Estado', kind: 'badge' }, { key: '_wa', label: 'Clics WhatsApp', kind: 'num' }],
    fields: [
      { name: 'title', label: 'Título', type: 'text', required: true },
      { name: 'kind', label: 'Tipo', type: 'select', options: ['promocion', 'sorteo'], required: true },
      { name: 'description', label: 'Descripción', type: 'textarea', required: true },
      { name: 'hashtags', label: 'Hashtags (#ejemplo #otro)', type: 'tags', required: true },
      { name: 'image', label: 'Imagen', type: 'image', urlField: 'imageUrl' },
      { name: 'startDate', label: 'Inicio', type: 'date', required: true },
      { name: 'endDate', label: 'Fin (único visible al público)', type: 'date', required: true },
      bool('active', 'Publicada (puedes pausarla sin borrarla)'),
    ],
  },
  auditoria: {
    collection: 'audit-logs', title: 'Auditoría', singular: 'registro', blurb: 'Quién hizo qué y cuándo. Los registros no se pueden editar ni borrar.', noCreate: true, noDelete: true, sort: '-createdAt', searchField: 'summary', searchFields: ['summary', 'actor', 'entity'],
    cols: [{ key: 'createdAt', label: 'Cuándo', kind: 'datetime' }, { key: 'actor', label: 'Usuario' }, { key: 'entity', label: 'Módulo' }, { key: 'action', label: 'Acción', kind: 'badge' }, { key: 'summary', label: 'Detalle' }],
    fields: [],
  },
}

export const MODULE_LABELS: Record<string, string> = {
  resumen: 'Resumen', usuarios: 'Usuarios', permisos: 'Permisos', sedes: 'Sedes', categorias: 'Categorías de producto', productos: 'Productos', inventario: 'Inventario',
  clientes: 'Clientes', proveedores: 'Proveedores', ventas: 'Ventas', pos: 'Punto de venta', domicilios: 'Domicilios', facturacion: 'Factura electrónica', caja: 'Caja',
  conceptos: 'Conceptos de caja', cierre: 'Cierre de jornada', eventos: 'Eventos', promociones: 'Promociones y sorteos', auditoria: 'Auditoría', analitica: 'Analítica', cuenta: 'Mi cuenta',
}
