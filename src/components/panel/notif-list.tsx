'use client'
import { markNotification } from '@/lib/panel-actions'
import { Empty, useDo } from './kit'

export function NotifList({ items }: { items: { id: string; title: string; message: string; type: string; status: string; when: string }[] }) {
  const { run } = useDo()
  if (!items.length) return <Empty text="No tienes notificaciones." />
  return (
    <ul className="divide-y divide-plum/10 text-sm">
      {items.map((n) => (
        <li key={n.id} className="flex items-start gap-3 py-2.5">
          <span className={`mt-1.5 size-2.5 shrink-0 rounded-full ${n.status === 'no_leida' ? 'bg-brand' : 'bg-ink/20'}`} aria-hidden />
          <div className="min-w-0 flex-1"><p className="font-bold">{n.title}</p><p className="text-ink/65">{n.message}</p><p className="text-xs text-ink/45">{n.when}</p></div>
          <div className="flex flex-col gap-1 text-xs font-bold text-plum">
            {n.status === 'no_leida' && <button onClick={() => run(() => markNotification(n.id, 'leida'))}>Leída</button>}
            <button onClick={() => run(() => markNotification(n.id, 'archivada'))}>Archivar</button>
          </div>
        </li>
      ))}
    </ul>
  )
}
