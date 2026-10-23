import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { Plus, Printer as PrinterIcon } from '@phosphor-icons/react'
import { Page, PageHeader } from '@/components/layout/AppShell'
import { ThemeSwitcher } from '@/components/layout/ThemeSwitcher'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { Checkbox, Field, Input, NumberInput, Select } from '@/components/ui/field'
import { Badge, Card, Segmented } from '@/components/ui/misc'
import { ErrorState, ListSkeleton } from '@/components/ui/states'
import { useAuth } from '@/features/auth/AuthProvider'
import { formatPhone, normalizePhone, cleanInstagram, brl, number } from '@/lib/format'
import { keys, must, useAction, usePrinters, useSettings } from '@/lib/queries'
import { supabase } from '@/lib/supabase'
import type { Printer, Settings } from '@/lib/types'
import { missingSettings } from './missing'

function Section({ title, description, children }: { title: string; description?: ReactNode; children: ReactNode }) {
  return (
    <Card className="p-4 sm:p-6">
      <h2 className="text-base font-semibold">{title}</h2>
      {description && <p className="mt-1 text-sm text-fg-muted">{description}</p>}
      <div className="mt-5">{children}</div>
    </Card>
  )
}

export function SettingsPage() {
  const settings = useSettings()
  const printers = usePrinters()
  const auth = useAuth()

  return (
    <>
      <PageHeader title="Configurações" description="Parâmetros de preço, impressoras e dados do estúdio." />
      <Page>
        <div className="flex max-w-3xl flex-col gap-4">
        {settings.isPending || printers.isPending ? (
          <ListSkeleton rows={3} height="h-48" />
        ) : settings.error || printers.error ? (
          <ErrorState error={settings.error ?? printers.error} onRetry={() => (settings.refetch(), printers.refetch())} />
        ) : (
          <>
            <MissingBanner settings={settings.data} printers={printers.data} />
            <PricingForm settings={settings.data} />
            <PrintersSection settings={settings.data} printers={printers.data} />
            <StudioForm settings={settings.data} />
            <Section title="Aparência" description="Escolha o tema ou deixe seguir o do aparelho.">
              <ThemeSwitcher />
            </Section>
            <Section title="Conta">
              <p className="text-sm text-fg-muted">
                Conectado como <span className="text-fg">{auth.status === 'owner' ? auth.session.user.email : ''}</span>
              </p>
              <Button className="mt-3" variant="outline" size="sm" onClick={() => supabase.auth.signOut()}>
                Sair
              </Button>
            </Section>
          </>
        )}
        </div>
      </Page>
    </>
  )
}

function MissingBanner({ settings, printers }: { settings: Settings; printers: Printer[] }) {
  const missing = missingSettings(settings, printers)
  if (!missing.length) return null
  return (
    <div role="status" className="rounded-ui border border-accent/40 bg-accent-soft p-4 text-sm">
      <p className="font-medium text-fg">Falta preencher para a calculadora funcionar:</p>
      <p className="mt-1 text-fg-muted">{missing.join(', ')}.</p>
    </div>
  )
}

function PricingForm({ settings }: { settings: Settings }) {
  const [v, setV] = useState(settings)
  useEffect(() => setV(settings), [settings])
  const set = <K extends keyof Settings>(k: K, val: Settings[K]) => setV((s) => ({ ...s, [k]: val }))

  const save = useAction(
    async (s: Settings) =>
      must(
        await supabase
          .from('settings')
          .update({
            energy_tariff: s.energy_tariff,
            labor_rate: s.labor_rate,
            failure_rate_pct: s.failure_rate_pct,
            margin_pct: s.margin_pct,
            urgency_pct: s.urgency_pct,
            rounding: s.rounding,
            quote_validity_days: s.quote_validity_days,
            low_stock_default_g: s.low_stock_default_g,
          })
          .eq('id', 1),
      ),
    { invalidate: [keys.settings], success: 'Parâmetros salvos' },
  )

  function submit(e: FormEvent) {
    e.preventDefault()
    save.mutate(v)
  }

  return (
    <Section
      title="Preço"
      description="Usados em todo orçamento novo. Orçamentos já feitos guardam os valores da época."
    >
      <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
        <Field label="Tarifa de energia" hint="Valor do kWh na conta de luz, com impostos.">
          {(p) => <NumberInput {...p} prefix="R$" suffix="/kWh" digits={4} value={v.energy_tariff} onValueChange={(x) => set('energy_tariff', x)} />}
        </Field>
        <Field label="Valor da hora de pós-processamento" hint="Lixar, pintar, montar.">
          {(p) => <NumberInput {...p} prefix="R$" suffix="/h" value={v.labor_rate} onValueChange={(x) => set('labor_rate', x)} />}
        </Field>
        <Field label="Taxa de falha" hint="Somada ao custo para cobrir impressões perdidas. O financeiro mostra a taxa real.">
          {(p) => <NumberInput {...p} suffix="%" value={v.failure_rate_pct} onValueChange={(x) => set('failure_rate_pct', x)} />}
        </Field>
        <Field label="Margem" hint="Sobre o custo com falha. 100% = cobra o dobro do custo.">
          {(p) => <NumberInput {...p} suffix="%" value={v.margin_pct} onValueChange={(x) => set('margin_pct', x)} />}
        </Field>
        <Field label="Acréscimo de urgência" hint="Aplicado só nas peças marcadas como urgentes." optional>
          {(p) => <NumberInput {...p} suffix="%" value={v.urgency_pct} onValueChange={(x) => set('urgency_pct', x)} />}
        </Field>
        <Field label="Validade do orçamento" hint="Em dias, a partir da criação.">
          {(p) => (
            <NumberInput {...p} suffix="dias" digits={0} value={v.quote_validity_days} onValueChange={(x) => set('quote_validity_days', x == null ? null : Math.round(x))} />
          )}
        </Field>
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium" id="rounding-label">
            Arredondar preço para
          </span>
          <Segmented<'90' | '00'>
            label="Arredondar preço para"
            value={(v.rounding as '90' | '00') ?? ('' as '90')}
            onChange={(x) => set('rounding', x)}
            options={[
              { value: '90', label: 'final ,90' },
              { value: '00', label: 'final ,00' },
            ]}
            className="self-start"
          />
          <span className="text-xs text-fg-subtle">Sempre para cima. Ex.: 37,20 vira 37,90 ou 38,00.</span>
        </div>
        <Field label="Estoque mínimo padrão" hint="Alerta quando um carretel fica abaixo disso. Cada carretel pode ter o seu.">
          {(p) => <NumberInput {...p} suffix="g" digits={0} value={v.low_stock_default_g} onValueChange={(x) => set('low_stock_default_g', x)} />}
        </Field>
        <div className="sm:col-span-2">
          <Button type="submit" variant="primary" loading={save.isPending}>
            Salvar parâmetros
          </Button>
        </div>
      </form>
    </Section>
  )
}

function PrintersSection({ settings, printers }: { settings: Settings; printers: Printer[] }) {
  const [editing, setEditing] = useState<Printer | 'new' | null>(null)
  const setDefault = useAction(
    async (id: string) => must(await supabase.from('settings').update({ default_printer_id: id }).eq('id', 1)),
    { invalidate: [keys.settings], success: 'Impressora padrão alterada' },
  )

  return (
    <Section
      title="Impressoras"
      description="Potência média e desgaste entram no custo de cada hora de impressão."
    >
      <ul className="flex flex-col gap-2">
        {printers.map((p) => (
          <li key={p.id} className="flex items-center gap-3 rounded-ui border border-border p-3">
            <PrinterIcon className="size-6 shrink-0 text-silver" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium">{p.name}</span>
                {settings.default_printer_id === p.id && <Badge>Padrão</Badge>}
                {!p.active && <Badge>Inativa</Badge>}
              </div>
              <p className="num mt-0.5 text-sm text-fg-muted">
                {p.model ? `${p.model} · ` : ''}
                {p.power_kw != null ? `${number(Number(p.power_kw) * 1000, 0)} W` : 'potência a preencher'} ·{' '}
                {p.wear_per_hour != null ? `${brl(p.wear_per_hour)}/h` : 'desgaste a preencher'}
                {p.bed_x_mm != null && ` · mesa ${number(Number(p.bed_x_mm))} × ${number(Number(p.bed_y_mm))} × ${number(Number(p.bed_z_mm))} mm`}
              </p>
            </div>
            <div className="flex gap-1">
              {settings.default_printer_id !== p.id && printers.length > 1 && (
                <Button size="sm" variant="ghost" onClick={() => setDefault.mutate(p.id)}>
                  Tornar padrão
                </Button>
              )}
              <Button size="sm" onClick={() => setEditing(p)}>
                Editar
              </Button>
            </div>
          </li>
        ))}
      </ul>
      <Button className="mt-3" variant="ghost" size="sm" onClick={() => setEditing('new')}>
        <Plus /> Adicionar impressora
      </Button>
      {editing && <PrinterDialog printer={editing === 'new' ? null : editing} onClose={() => setEditing(null)} />}
    </Section>
  )
}

function PrinterDialog({ printer, onClose }: { printer: Printer | null; onClose: () => void }) {
  const [name, setName] = useState(printer?.name ?? '')
  const [model, setModel] = useState(printer?.model ?? '')
  // o banco guarda kW (entra direto na fórmula); a tela usa watts, como a impressora informa
  const [powerW, setPowerW] = useState<number | null>(printer?.power_kw != null ? Math.round(Number(printer.power_kw) * 1000 * 10) / 10 : null)
  const [wear, setWear] = useState<number | null>(printer?.wear_per_hour ?? null)
  const [active, setActive] = useState(printer?.active ?? true)
  const [bedX, setBedX] = useState<number | null>(printer?.bed_x_mm != null ? Number(printer.bed_x_mm) : null)
  const [bedY, setBedY] = useState<number | null>(printer?.bed_y_mm != null ? Number(printer.bed_y_mm) : null)
  const [bedZ, setBedZ] = useState<number | null>(printer?.bed_z_mm != null ? Number(printer.bed_z_mm) : null)

  const save = useAction(
    async () => {
      const row = { name: name.trim(), model: model.trim() || null, power_kw: powerW == null ? null : powerW / 1000, wear_per_hour: wear, active, bed_x_mm: bedX, bed_y_mm: bedY, bed_z_mm: bedZ }
      if (printer) return must(await supabase.from('printers').update(row).eq('id', printer.id))
      return must(await supabase.from('printers').insert(row))
    },
    { invalidate: [keys.printers], success: 'Impressora salva', onSuccess: onClose },
  )

  return (
    <Dialog
      open
      onOpenChange={(o) => !o && onClose()}
      title={printer ? 'Editar impressora' : 'Nova impressora'}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="primary" form="printer-form" type="submit" loading={save.isPending}>
            Salvar
          </Button>
        </>
      }
    >
      <form
        id="printer-form"
        className="grid gap-4 sm:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault()
          if (name.trim()) save.mutate(undefined)
        }}
      >
        <Field label="Nome">{(p) => <Input {...p} required value={name} onChange={(e) => setName(e.target.value)} />}</Field>
        <Field label="Modelo" optional>
          {(p) => <Input {...p} value={model} onChange={(e) => setModel(e.target.value)} />}
        </Field>
        <Field label="Potência média" hint="Consumo médio durante a impressão, em watts. Ex.: 180 W. Meça com um medidor de tomada se puder.">
          {(p) => <NumberInput {...p} suffix="W" digits={1} value={powerW} onValueChange={setPowerW} />}
        </Field>
        <Field label="Desgaste" hint="Peças, manutenção e depreciação divididos pelas horas de uso.">
          {(p) => <NumberInput {...p} prefix="R$" suffix="/h" value={wear} onValueChange={setWear} />}
        </Field>
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <span className="text-sm font-medium">Área de impressão</span>
          <div className="grid grid-cols-3 gap-2">
            <NumberInput aria-label="Largura da mesa (X)" suffix="mm" digits={1} value={bedX} onValueChange={setBedX} placeholder="X" />
            <NumberInput aria-label="Profundidade da mesa (Y)" suffix="mm" digits={1} value={bedY} onValueChange={setBedY} placeholder="Y" />
            <NumberInput aria-label="Altura máxima (Z)" suffix="mm" digits={1} value={bedZ} onValueChange={setBedZ} placeholder="Z" />
          </div>
          <span className="text-xs text-fg-subtle">Usada na aba Modelos para avisar quando a peça não cabe.</span>
        </div>
        <Checkbox label="Em uso" checked={active} onChange={(e) => setActive(e.target.checked)} />
      </form>
    </Dialog>
  )
}

function StudioForm({ settings }: { settings: Settings }) {
  const [name, setName] = useState(settings.business_name)
  const [wa, setWa] = useState(formatPhone(settings.business_whatsapp))
  const [ig, setIg] = useState(settings.business_instagram ?? '')

  const save = useAction(
    async () =>
      must(
        await supabase
          .from('settings')
          .update({ business_name: name.trim() || 'Zanshin 3D Studio', business_whatsapp: normalizePhone(wa), business_instagram: cleanInstagram(ig) })
          .eq('id', 1),
      ),
    { invalidate: [keys.settings], success: 'Dados do estúdio salvos' },
  )

  return (
    <Section title="Estúdio" description="Aparece no orçamento em PDF e na página de acompanhamento do cliente.">
      <form
        className="grid gap-4 sm:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault()
          save.mutate(undefined)
        }}
      >
        <Field label="Nome" className="sm:col-span-2">
          {(p) => <Input {...p} value={name} onChange={(e) => setName(e.target.value)} />}
        </Field>
        <Field label="WhatsApp">
          {(p) => <Input {...p} inputMode="tel" autoComplete="tel" value={wa} onChange={(e) => setWa(e.target.value)} />}
        </Field>
        <Field label="Instagram" hint="Sem o @.">
          {(p) => <Input {...p} value={ig} onChange={(e) => setIg(e.target.value)} />}
        </Field>
        <div className="sm:col-span-2">
          <Button type="submit" variant="primary" loading={save.isPending}>
            Salvar dados
          </Button>
        </div>
      </form>
    </Section>
  )
}

export function PrinterSelect({ value, onChange, printers, id }: { value: string | null; onChange: (v: string) => void; printers: Printer[]; id?: string }) {
  return (
    <Select id={id} value={value ?? ''} onChange={(e) => onChange(e.target.value)}>
      {printers.map((p) => (
        <option key={p.id} value={p.id}>
          {p.name}
        </option>
      ))}
    </Select>
  )
}
