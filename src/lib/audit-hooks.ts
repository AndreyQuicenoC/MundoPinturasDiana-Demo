import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'
import { actorName } from './access'

const write = async (
  req: Parameters<CollectionAfterChangeHook>[0]['req'],
  entity: string,
  action: 'crear' | 'editar' | 'eliminar' | 'login' | 'logout' | 'anular',
  docId: unknown,
  summary: string,
) => {
  await req.payload.create({
    collection: 'audit-logs',
    overrideAccess: true,
    req,
    data: { actor: actorName(req), entity, action, docId: String(docId ?? ''), summary },
  })
}

export const auditHooks = (entity: string, label: (doc: any) => string) => ({
  afterChange: [
    (async ({ doc, operation, req }) => {
      if (req.context?.skipAudit) return doc
      await write(req, entity, operation === 'create' ? 'crear' : 'editar', doc.id, label(doc))
      return doc
    }) as CollectionAfterChangeHook,
  ],
  afterDelete: [
    (async ({ doc, req, id }) => {
      await write(req, entity, 'eliminar', id, label(doc))
      return doc
    }) as CollectionAfterDeleteHook,
  ],
})
