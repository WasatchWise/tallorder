import Link from 'next/link'

type ButtonVariant = 'primary' | 'secondary' | 'destructive' | 'ghost'
type ButtonSize = 'sm' | 'md' | 'lg'

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-[#D97706] text-white hover:bg-[#B45309] focus-visible:ring-[#D97706]',
  secondary: 'bg-transparent border border-[#D6D3D1] text-[#1C1917] hover:bg-[#F5F5F4] focus-visible:ring-[#D97706]',
  destructive: 'bg-transparent border border-[#DC2626] text-[#DC2626] hover:bg-[#FEF2F2] focus-visible:ring-red-500',
  ghost: 'bg-transparent text-[#78716C] hover:text-[#1C1917] focus-visible:ring-[#D97706]',
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-6 py-3 text-sm',
  lg: 'px-8 py-4 text-base',
}

interface ButtonProps {
  variant?: ButtonVariant
  size?: ButtonSize
  href?: string
  disabled?: boolean
  loading?: boolean
  className?: string
  children: React.ReactNode
  onClick?: () => void
  type?: 'button' | 'submit' | 'reset'
}

export default function Button({
  variant = 'primary',
  size = 'md',
  href,
  disabled,
  loading,
  className = '',
  children,
  onClick,
  type = 'button',
}: ButtonProps) {
  const base = 'inline-flex items-center justify-center font-semibold rounded-lg transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 cursor-pointer active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed'
  const classes = `${base} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`

  if (href) {
    return <Link href={href} className={classes}>{children}</Link>
  }

  return (
    <button type={type} onClick={onClick} disabled={disabled || loading} className={classes}>
      {loading ? (
        <span className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
          {children}
        </span>
      ) : children}
    </button>
  )
}
