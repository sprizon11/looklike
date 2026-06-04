import { shortLeggingsColorName, type ProductColor } from '@/lib/product-colors'
import { leggingsSwatchHex, swatchNeedsBorder } from '@/lib/leggings-swatch-colors'

type Props = {
  colors: ProductColor[]
  selectedName: string
  onSelect: (colorName: string) => void
  label?: string
  shape?: 'circle' | 'square'
}

function swatchFill(c: ProductColor) {
  if (c.swatch?.trim()) return { type: 'image' as const, value: c.swatch.trim() }
  const hex = c.swatchHex || leggingsSwatchHex(c.name)
  return { type: 'hex' as const, value: hex }
}

export default function LeggingsColorStrip({
  colors,
  selectedName,
  onSelect,
  label,
  shape = 'circle',
}: Props) {
  const rounded = shape === 'circle' ? 'rounded-full' : 'rounded-md'

  return (
    <div className="mt-2">
      {label ? <p className="font-body text-[13px] font-medium text-black mb-3">{label}</p> : null}
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 scroll-smooth [scrollbar-width:thin]">
        {colors.map((c) => {
          const active = selectedName === c.name
          const fill = swatchFill(c)
          const needsBorder = fill.type === 'hex' && swatchNeedsBorder(fill.value)
          const shortName = shortLeggingsColorName(c.name)

          return (
            <button
              key={c.id}
              type="button"
              onClick={() => onSelect(c.name)}
              aria-label={c.name}
              className={`shrink-0 flex flex-col items-center gap-1.5 w-[64px] transition-transform ${
                active ? 'scale-105' : 'hover:scale-105'
              }`}
            >
              <span
                className={`block w-11 h-11 sm:w-12 sm:h-12 ${rounded} border-2 overflow-hidden shadow-sm ${
                  active
                    ? 'border-gold ring-2 ring-gold/35'
                    : needsBorder
                      ? 'border-black/25'
                      : 'border-black/10'
                }`}
                style={fill.type === 'hex' ? { backgroundColor: fill.value } : undefined}
              >
                {fill.type === 'image' ? (
                  <img src={fill.value} alt="" className="w-full h-full object-cover" />
                ) : null}
              </span>
              <span
                className={`font-body text-[10px] leading-tight text-center w-full line-clamp-2 ${
                  active ? 'text-black font-medium' : 'text-black/55'
                }`}
              >
                {shortName}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
