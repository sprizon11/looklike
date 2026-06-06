import { colorStockHint, isColorAvailable } from '@/lib/color-stock'
import { shortLeggingsColorName, type ProductColor } from '@/lib/product-colors'
import { leggingsSwatchHex, swatchNeedsBorder } from '@/lib/leggings-swatch-colors'

type Props = {
  colors: ProductColor[]
  selectedName: string
  onSelect: (colorName: string) => void
  onUnavailable?: (color: ProductColor) => void
  label?: string
  shape?: 'circle' | 'square'
  /** When set, availability and stock hints use this size (per-colour per-size stock). */
  size?: string
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
  onUnavailable,
  label,
  shape = 'circle',
  size,
}: Props) {
  const rounded = shape === 'circle' ? 'rounded-full' : 'rounded-md'

  return (
    <div className="mt-2">
      {label ? <p className="font-body text-[13px] font-medium text-black mb-3">{label}</p> : null}
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 scroll-smooth [scrollbar-width:thin]">
        {colors.map((c) => {
          const active = selectedName === c.name
          const available = isColorAvailable(c, size)
          const hint = colorStockHint(c, size)
          const fill = swatchFill(c)
          const needsBorder = fill.type === 'hex' && swatchNeedsBorder(fill.value)
          const shortName = shortLeggingsColorName(c.name)

          return (
            <button
              key={c.id}
              type="button"
              onClick={() => {
                if (!available) {
                  onUnavailable?.(c)
                  return
                }
                onSelect(c.name)
              }}
              aria-label={available ? c.name : `${c.name} — out of stock`}
              className={`shrink-0 flex flex-col items-center gap-1.5 w-[64px] transition-transform ${
                !available
                  ? 'opacity-55 cursor-not-allowed'
                  : active
                    ? 'scale-105'
                    : 'hover:scale-105'
              }`}
            >
              <span
                className={`relative block w-11 h-11 sm:w-12 sm:h-12 ${rounded} border-2 overflow-hidden shadow-sm ${
                  !available
                    ? 'border-black/15'
                    : active
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
                {!available ? (
                  <span className="absolute inset-0 flex items-center justify-center bg-white/55">
                    <span className="font-body text-[8px] font-semibold uppercase text-red-700 leading-none text-center px-0.5">
                      OOS
                    </span>
                  </span>
                ) : null}
              </span>
              <span
                className={`font-body text-[10px] leading-tight text-center w-full line-clamp-2 ${
                  !available
                    ? 'text-red-600/90 font-medium'
                    : active
                      ? 'text-black font-medium'
                      : 'text-black/55'
                }`}
              >
                {shortName}
              </span>
              {hint ? (
                <span
                  className={`font-body text-[9px] leading-none ${
                    !available ? 'text-red-600 font-medium' : 'text-black/40'
                  }`}
                >
                  {hint}
                </span>
              ) : null}
            </button>
          )
        })}
      </div>
    </div>
  )
}
