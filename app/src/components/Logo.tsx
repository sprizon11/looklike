type LogoProps = {
  variant?: 'dark' | 'light'
  size?: 'sm' | 'md' | 'lg'
  tagline?: boolean
  align?: 'center' | 'start'
  className?: string
  onClick?: () => void
}

const SIZES = {
  sm: { word: 'text-[22px]', line: 'w-5', tag: 'text-[8px]' },
  md: { word: 'text-[28px]', line: 'w-6', tag: 'text-[9px]' },
  lg: { word: 'text-[40px]', line: 'w-8', tag: 'text-[11px]' },
}

export default function Logo({
  variant = 'dark',
  size = 'md',
  tagline = true,
  align = 'center',
  className = '',
  onClick,
}: LogoProps) {
  const color = variant === 'light' ? 'text-white' : 'text-black'
  const tagColor = variant === 'light' ? 'text-white/60' : 'text-black/45'
  const lineColor = variant === 'light' ? 'bg-white/40' : 'bg-black/25'
  const s = SIZES[size]
  const alignClass = align === 'start' ? 'items-start' : 'items-center'

  return (
    <span
      onClick={onClick}
      className={`inline-flex flex-col ${alignClass} leading-none select-none ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      <span className={`brand-logo ${s.word} ${color}`}>
        <span className="brand-look">Look</span>{' '}
        <span>Like</span>
      </span>
      {tagline && (
        <span className="mt-1.5 flex items-center gap-2">
          <span className={`h-px ${s.line} ${lineColor}`} />
          <span className={`brand-tagline ${s.tag} ${tagColor}`}>Ladies Wear</span>
          <span className={`h-px ${s.line} ${lineColor}`} />
        </span>
      )}
    </span>
  )
}
