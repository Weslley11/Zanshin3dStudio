import { useState } from 'react'
import { Copy, WhatsappLogo } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/field'
import { ORDER_STATUS_LABEL, type OrderStatus } from '@/lib/constants'
import { MESSAGE_LABEL, messageKeyForStatus, messageVars, renderTemplate, templatesFrom, type MessageKey, type MessageOrder } from '@/lib/messages'
import { useSettings } from '@/lib/queries'
import { waLink } from '@/lib/whatsapp'

/** Texto pronto de cada mensagem para um pedido, com os textos editados em Configurações. */
export function useCustomerMessage() {
  const settings = useSettings().data
  const templates = templatesFrom(settings)
  const text = (order: MessageOrder, key: MessageKey) => renderTemplate(templates[key], messageVars(order, settings, window.location.origin))
  const open = (order: MessageOrder, key: MessageKey, override?: string) => {
    window.open(waLink(order.customer?.whatsapp, override ?? text(order, key)), '_blank', 'noopener')
  }
  return { text, open }
}

/** Depois de mudar o status: confirma e oferece avisar o cliente com a mensagem da etapa. */
export function statusChangedToast(order: MessageOrder, status: OrderStatus, msg: ReturnType<typeof useCustomerMessage>) {
  const key = messageKeyForStatus(status)
  const title = `Pedido em "${ORDER_STATUS_LABEL[status]}"`
  if (!key || !order.customer) return toast.success(title)
  toast.success(title, {
    description: order.customer.whatsapp ? `Avisar ${order.customer.name.split(' ')[0]} no WhatsApp?` : undefined,
    duration: 9000,
    action: { label: 'Avisar cliente', onClick: () => msg.open(order, key) },
  })
}

/** Mostra o texto antes de enviar, para ajustar alguma palavra se quiser. */
export function MessageDialog({ order, messageKey, onClose }: { order: MessageOrder; messageKey: MessageKey; onClose: () => void }) {
  const msg = useCustomerMessage()
  const [text, setText] = useState(() => msg.text(order, messageKey))
  return (
    <Dialog
      open
      onOpenChange={(o) => !o && onClose()}
      title={MESSAGE_LABEL[messageKey]}
      description={order.customer?.whatsapp ? `Para ${order.customer.name}` : 'Cliente sem WhatsApp: o app abre para você escolher o contato.'}
      footer={
        <>
          <Button
            variant="ghost"
            onClick={async () => {
              await navigator.clipboard.writeText(text)
              toast.success('Texto copiado')
            }}
          >
            <Copy /> Copiar
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              msg.open(order, messageKey, text)
              onClose()
            }}
          >
            <WhatsappLogo /> Abrir no WhatsApp
          </Button>
        </>
      }
    >
      <label htmlFor="msg-text" className="sr-only">
        Texto da mensagem
      </label>
      <Textarea id="msg-text" rows={6} value={text} onChange={(e) => setText(e.target.value)} />
      <p className="mt-2 text-xs text-fg-subtle">Para mudar o texto de vez, edite em Configurações → Mensagens para o cliente.</p>
    </Dialog>
  )
}
