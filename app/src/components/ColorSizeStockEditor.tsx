import {
  syncColorSizeStockWithLabels,
  type ColorSizeStock,
} from '@/lib/color-size-stock'

type Props = {
  sizeLabels: string[]
  sizeStock: ColorSizeStock[] | undefined
  onChange: (rows: ColorSizeStock[]) => void
}

export default function ColorSizeStockEditor({ sizeLabels, sizeStock, onChange }: Props) {
  const labels = sizeLabels.map((s) => s.trim()).filter(Boolean)
  const rows = syncColorSizeStockWithLabels(sizeStock, labels)

  if (labels.length === 0) {
    return (
      <p className="font-body text-[11px] text-black/40">
        Add sizes in the list above first — then set quantity per size for this colour.
      </p>
    )
  }

  return (
    <div>
      <label className="font-body text-[10px] uppercase tracking-[0.06em] text-black/45">
        Quantity per size (0 = out of stock)
      </label>
      <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
        {rows.map((row) => (
          <div key={row.size} className="p-2 border border-black/10 bg-[#fafafa]">
            <p className="font-body text-[11px] font-medium text-black mb-1">{row.size}</p>
            <input
              inputMode="numeric"
              value={String(row.qty)}
              onChange={(e) => {
                const qty = Math.max(0, Math.floor(Number(e.target.value) || 0))
                onChange(
                  rows.map((r) => (r.size === row.size ? { ...r, qty } : r))
                )
              }}
              className="w-full h-[34px] px-2 border border-black/10 font-body text-[13px] focus:outline-none focus:border-black/30"
              placeholder="0"
            />
          </div>
        ))}
      </div>
    </div>
  )
}
