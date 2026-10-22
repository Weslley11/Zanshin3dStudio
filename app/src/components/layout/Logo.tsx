import icon from '@/assets/logo-icon.png'
import { cn } from '@/lib/utils'

export function Logo({ className, withText = true }: { className?: string; withText?: boolean }) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <img src={icon} alt="" className="size-8 object-contain" width={32} height={32} />
      {withText && (
        <span className="flex flex-col leading-none">
          <span className="text-[15px] font-semibold tracking-tight">Zanshin</span>
          <span className="text-[11px] font-medium tracking-[0.14em] text-silver uppercase">3D Studio</span>
        </span>
      )}
    </span>
  )
}
