import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { CubeFocus } from '@phosphor-icons/react'
import { Card } from '@/components/ui/misc'
import { must } from '@/lib/queries'
import { photoUrl, supabase } from '@/lib/supabase'

/** Modelos 3D ligados ao pedido (aparece só quando há algum). */
export function OrderModels({ orderId }: { orderId: string }) {
  const q = useQuery({
    queryKey: ['models', 'pedido', orderId],
    queryFn: async () => must(await supabase.from('models').select('id, name, thumbnail_path, format').eq('order_id', orderId).order('created_at')),
  })
  if (!q.data?.length) return null
  return (
    <Card className="p-4">
      <h2 className="mb-3 text-sm font-semibold">Modelos 3D</h2>
      <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {q.data.map((m) => (
          <li key={m.id}>
            <Link to={`/modelos/${m.id}`} className="block overflow-hidden rounded-ui border border-border hover:border-border-strong">
              {m.thumbnail_path ? (
                <img src={photoUrl(m.thumbnail_path)!} alt="" className="aspect-square w-full bg-surface-2 object-contain p-1" loading="lazy" />
              ) : (
                <span className="flex aspect-square items-center justify-center bg-surface-2">
                  <CubeFocus className="size-6 text-fg-subtle" />
                </span>
              )}
              <span className="block truncate px-2 py-1.5 text-xs">{m.name}</span>
            </Link>
          </li>
        ))}
      </ul>
    </Card>
  )
}
