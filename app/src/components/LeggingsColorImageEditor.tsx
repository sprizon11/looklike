import { useEffect, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { compressProductImage, PRODUCT_IMAGE_SIZE } from '@/lib/compress-image'
import {
  buildLeggingsProductColorsLean,
  emptyColorEntry,
  padColorImageSlots,
  shortLeggingsColorName,
  type ProductColor,
} from '@/lib/product-colors'

type Props = {
  colors: ProductColor[]
  onChange: (colors: ProductColor[]) => void
  onError?: (message: string) => void
}

const CATALOG = buildLeggingsProductColorsLean()

function catalogEntry(name: string): ProductColor {
  const found = CATALOG.find((c) => c.name === name)
  if (!found) return emptyColorEntry(name)
  return {
    ...found,
    images: ['', '', ''],
    image: '',
  }
}

export default function LeggingsColorImageEditor({ colors, onChange, onError }: Props) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const selectedNames = new Set(colors.map((c) => c.name.trim()).filter(Boolean))

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  const toggleColor = (name: string) => {
    const key = name.trim()
    if (selectedNames.has(key)) {
      onChange(colors.filter((c) => c.name.trim() !== key))
    } else {
      onChange([...colors, catalogEntry(key)])
    }
  }

  const setColorImage = (id: string, slotIdx: number, dataUrl: string) => {
    onChange(
      colors.map((c) => {
        if (c.id !== id) return c
        const imgs = padColorImageSlots(c.images, c.image)
        imgs[slotIdx] = dataUrl
        const filled = imgs.filter(Boolean)
        return {
          ...c,
          images: imgs,
          image: filled[0] || dataUrl,
        }
      })
    )
  }

  return (
    <div className="space-y-4">
      <div ref={rootRef} className="relative">
        <label className="font-body text-[12px] uppercase tracking-[0.06em] text-black/50">
          Select colours
        </label>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="w-full mt-1 h-[42px] px-3 border border-black/10 font-body text-[13px] bg-white flex items-center justify-between gap-2 hover:border-black/25 focus:outline-none focus:border-black/30"
        >
          <span className="truncate text-left">
            {colors.length === 0
              ? 'Choose colours from the chart…'
              : `${colors.length} colour${colors.length === 1 ? '' : 's'} selected`}
          </span>
          <ChevronDown
            size={16}
            className={`shrink-0 text-black/40 transition-transform ${open ? 'rotate-180' : ''}`}
          />
        </button>
        {open && (
          <div className="absolute z-20 left-0 right-0 mt-1 max-h-[280px] overflow-y-auto border border-black/15 bg-white shadow-lg p-2">
            <p className="font-body text-[11px] text-black/45 px-2 pb-2 sticky top-0 bg-white">
              Tick colours you sell — then upload a photo for each below.
            </p>
            <ul className="space-y-0.5">
              {CATALOG.map((c) => {
                const checked = selectedNames.has(c.name)
                const short = shortLeggingsColorName(c.name)
                return (
                  <li key={c.id}>
                    <label className="flex items-center gap-2 px-2 py-1.5 hover:bg-black/[0.03] cursor-pointer rounded-sm">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleColor(c.name)}
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

      {colors.length > 0 ? (
        <div className="space-y-4 max-h-[420px] overflow-y-auto pr-1">
          <p className="font-body text-[11px] text-black/35">
            Upload 1–3 photos per selected colour ({PRODUCT_IMAGE_SIZE}×{PRODUCT_IMAGE_SIZE} px). Customers see
            this image when they tap that colour.
          </p>
          {colors.map((color) => {
            const slots = padColorImageSlots(color.images, color.image)
            return (
              <div key={color.id} className="p-3 border border-black/10 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-body text-[12px] font-medium text-black">
                    {shortLeggingsColorName(color.name)}
                  </span>
                  <button
                    type="button"
                    onClick={() => onChange(colors.filter((c) => c.id !== color.id))}
                    className="font-body text-[11px] text-red-600 hover:text-red-700"
                  >
                    Remove
                  </button>
                </div>
                <p className="font-body text-[10px] text-black/40">{color.name}</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {slots.map((slotUrl, slotIdx) => (
                    <div key={slotIdx} className="space-y-1">
                      <p className="font-body text-[10px] uppercase text-black/40">
                        Photo {slotIdx + 1}
                        {slotIdx === 0 ? ' (required)' : ' (optional)'}
                      </p>
                      <input
                        type="file"
                        accept="image/*"
                        className="w-full font-body text-[11px]"
                        onChange={async (e) => {
                          const file = e.target.files?.[0]
                          if (!file) return
                          try {
                            const dataUrl = await compressProductImage(file)
                            setColorImage(color.id, slotIdx, dataUrl)
                          } catch {
                            onError?.('Could not use that image. Try a JPG or PNG under 5 MB.')
                          }
                          e.target.value = ''
                        }}
                      />
                      {slotUrl ? (
                        <img
                          src={slotUrl}
                          alt={color.name}
                          className="w-full aspect-square object-cover border border-black/10"
                        />
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <p className="font-body text-[12px] text-black/45">
          No colours selected yet. Open the dropdown above and tick the colours you stock.
        </p>
      )}
    </div>
  )
}
