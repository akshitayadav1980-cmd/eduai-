type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'
type AvatarColor = 'cyan' | 'violet' | 'emerald' | 'amber' | 'rose'

interface AvatarProps {
  name: string
  src?: string
  size?: AvatarSize
  color?: AvatarColor
  className?: string
}

const sizeMap: Record<AvatarSize, { wrapper: string; text: string }> = {
  xs: { wrapper: 'h-6 w-6', text: 'text-[10px]' },
  sm: { wrapper: 'h-8 w-8', text: 'text-xs' },
  md: { wrapper: 'h-10 w-10', text: 'text-sm' },
  lg: { wrapper: 'h-12 w-12', text: 'text-base' },
  xl: { wrapper: 'h-16 w-16', text: 'text-xl' },
}

const colorMap: Record<AvatarColor, string> = {
  cyan: 'from-cyan-600 to-cyan-800',
  violet: 'from-violet-600 to-violet-800',
  emerald: 'from-emerald-600 to-emerald-800',
  amber: 'from-amber-600 to-amber-800',
  rose: 'from-rose-600 to-rose-800',
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

function colorFromName(name: string): AvatarColor {
  const colors: AvatarColor[] = ['cyan', 'violet', 'emerald', 'amber', 'rose']
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return colors[Math.abs(hash) % colors.length]
}

export function Avatar({ name, src, size = 'md', color, className = '' }: AvatarProps) {
  const s = sizeMap[size]
  const c = color ?? colorFromName(name)

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={`rounded-full object-cover shrink-0 ${s.wrapper} ${className}`}
      />
    )
  }

  return (
    <div
      aria-label={name}
      className={[
        `inline-flex items-center justify-center rounded-full bg-gradient-to-br shrink-0 font-semibold text-white`,
        colorMap[c],
        s.wrapper,
        s.text,
        className,
      ].join(' ')}
    >
      {getInitials(name)}
    </div>
  )
}
