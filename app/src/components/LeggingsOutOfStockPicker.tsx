import { useEffect, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { buildLeggingsProductColorsLean } from '@/lib/product-colors'
import { shortLeggingsColorName } from '@/lib/product-colors'

type Props = {
  selected: string[]
  onChange: (names: string[]) => void
}

const ALL_COLORS = buildLeggingsProductColorsLean()

export default function LeggingsOutOfStockPicker({ selected, onChange }: Props) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  const toggle = (name: string) => {
    const key = name.trim()
    if (selected.includes(key)) {
      onChange(selected.filter((n) => n !== key))
    } else {
      onChange([...selected, key])
    }
  }

  return (
    <div ref={rootRef} className="relative">
      <label className="font-body text-[12px] uppercase tracking-[0.06em] text-black/50">
        Out of stock colours
      </label>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full mt-1 h-[42px] px-3 border border-black/10 font-body text-[13px] bg-white flex items-center justify-between gap-2 hover:border-black/25 focus:outline-none focus:border-black/30"
      >
        <span className="truncate text-left">
          {selected.length === 0
            ? 'Select colours with no stock…'
            : `${selected.length} colour${selected.length === 1 ? '' : 's'} marked out of stock`}
        </span>
        <ChevronDown
          size={16}
          className={`shrink-0 text-black/40 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && (
        <div className="absolute z-20 left-0 right-0 mt-1 max-h-[280px] overflow-y-auto border border-black/15 bg-white shadow-lg p-2">
          <p className="font-body text-[11px] text-black/45 px-2 pb-2 sticky top-0 bg-white">
            Tick colours you do not have — customers cannot order these.
          </p>
          <ul className="space-y-0.5">
            {ALL_COLORS.map((c) => {
              const checked = selected.includes(c.name)
              const short = shortLeggingsColorName(c.name)
              return (
                <li key={c.id}>
                  <label className="flex items-center gap-2 px-2 py-1.5 hover:bg-black/[0.03] cursor-pointer rounded-sm">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggle(c.name)}
                      className="shrink-0"
                    />
                    <span
                      className="w-5 h-5 rounded-full border border-black/15 shrink-0"
                      style={{ backgroundColor: c.swatchHex || '#ccc' }}
                      aria-hidden
                    />
                    <span className="font-body text-[12px] text-black truncate">{short}</span>
                    <span className="font-body text-[10px] text-black/35 truncate ml-auto">{c.name}</span>
                  </label>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}
