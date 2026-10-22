import { cva, type VariantProps } from 'class-variance-authority'
import { Slot } from 'radix-ui'
import type { ComponentProps } from 'react'
import { CircleNotch } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'

export const buttonVariants = cva(
  'inline-flex shrink-0 items-center justify-center gap-2 rounded-ui font-medium whitespace-nowrap transition-[background-color,border-color,color,transform] duration-150 select-none active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        primary: 'bg-accent text-accent-fg hover:bg-accent-hover',
        secondary: 'border border-border-strong bg-surface-2 text-fg hover:bg-surface-3',
        ghost: 'text-fg-muted hover:bg-surface-2 hover:text-fg',
        outline: 'border border-border-strong text-fg hover:bg-surface-2',
        danger: 'border border-border-strong text-danger hover:bg-accent-soft',
      },
      size: {
        sm: 'h-8 px-3 text-sm [&_svg]:size-4',
        md: 'h-10 px-4 text-sm [&_svg]:size-[18px]',
        lg: 'h-12 px-5 text-base [&_svg]:size-5',
        icon: 'size-10 [&_svg]:size-5',
        'icon-sm': 'size-8 [&_svg]:size-4',
      },
    },
    defaultVariants: { variant: 'secondary', size: 'md' },
  },
)

type ButtonProps = ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean; loading?: boolean }

export function Button({ className, variant, size, asChild, loading, children, disabled, ...props }: ButtonProps) {
  const Comp = asChild ? Slot.Root : 'button'
  return (
    <Comp
      className={cn(buttonVariants({ variant, size }), className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {asChild ? (
        children
      ) : (
        <>
          {loading && <CircleNotch className="animate-spin" aria-hidden />}
          {children}
        </>
      )}
    </Comp>
  )
}
