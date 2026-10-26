import { RESOURCES, type ResourceCfg } from '@/lib/panel-config'
import { findPage, options, type PageResult } from '@/lib/panel-data'
import { spPage, spStr, type PanelCtx } from '@/lib/panel-ctx'
import type { ModuleKey } from '@/lib/access'
import type { Row } from '@/components/panel/kit'
import { ResourceModule } from '@/components/panel/resource-module'
import { Head, Wrap } from '@/components/panel/page-head'

type Opts = {
  /** Filtro adicional (Payload where). */
  where?: any
  /** Orden distinto al de la configuración. */
  sort?: string
  /** Enriquece las filas de la página (columnas calculadas). */
  decorate?: (rows: Row[]) => Promise<Row[]> | Row[]
  /** Controles (pestañas, filtros) encima de la tabla. */
  above?: React.ReactNode
}

/** Vista CRUD genérica basada en RESOURCES: paginada (15), con búsqueda (?q=) y página (?page=) en la URL. */
export async function resourceView(ctx: PanelCtx, key: ModuleKey, o: Opts = {}) {
  const res: ResourceCfg = RESOURCES[key]!
  const q = spStr(ctx.sp.q).trim().slice(0, 80)
  const fields = res.searchFields ?? (res.searchField ? [res.searchField] : [])
  const and: any[] = []
  if (o.where) and.push(o.where)
  if (q && fields.length) and.push({ or: fields.map((f) => ({ [f]: { like: q } })) })
  const pageRes: PageResult = await findPage(ctx.user, res.collection, {
    sort: o.sort ?? res.sort ?? '-createdAt', page: spPage(ctx.sp), overrideAccess: ctx.overrideAccess,
    where: and.length ? { and } : undefined,
  })
  const rows = o.decorate ? await o.decorate(pageRes.docs) : pageRes.docs
  const relNames = [...new Set(res.fields.filter((f) => f.type === 'relation').map((f) => f.relation!))]
  const opts = Object.fromEntries(await Promise.all(relNames.map(async (c) => [c, await options(ctx.user, c, undefined, ctx.overrideAccess)])))
  const canDelete = ctx.canWrite && (ctx.role === 'admin' || (ctx.role === 'gerente' && ['productos', 'clientes', 'eventos', 'domicilios', 'promociones', 'conceptos'].includes(key)))
  return (
    <Wrap head={<Head title={res.title} blurb={res.blurb} />}>
      {o.above}
      <ResourceModule
        moduleKey={key} cfg={res} rows={rows} q={q} sp={ctx.sp}
        pageInfo={{ page: pageRes.page, totalPages: pageRes.totalPages, totalDocs: pageRes.totalDocs }}
        options={opts} canWrite={ctx.canWrite && res.fields.length > 0} canDelete={canDelete}
      />
    </Wrap>
  )
}
