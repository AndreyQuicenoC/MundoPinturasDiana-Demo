import type { PanelCtx } from '@/lib/panel-ctx'
import { resourceView } from './_resource'

export default async function Module(ctx: PanelCtx) {
  return resourceView(ctx, 'categorias')
}
