import {
  bottomRowsFromSizeLabels,
  emptySizeGuide,
  kurtiRowsFromSizeLabels,
  sizeGuideTypeForCategory,
  type BottomSizeGuideRow,
  type KurtiSizeGuideRow,
  type SizeGuide,
} from '@/lib/size-guide'

type Props = {
  category: string
  sizeLabels: string[]
  guide: SizeGuide | undefined
  onChange: (guide: SizeGuide | undefined) => void
}

export default function AdminSizeGuideEditor({ category, sizeLabels, guide, onChange }: Props) {
  const type = sizeGuideTypeForCategory(category)
  if (!type) return null

  const current = guide?.type === type ? guide : emptySizeGuide(type)

  const syncFromSizes = () => {
    const labels = sizeLabels.map((s) => s.trim()).filter(Boolean)
    if (labels.length === 0) return
    if (type === 'kurti') {
      onChange({ type: 'kurti', rows: kurtiRowsFromSizeLabels(labels), note: current.note })
    } else {
      onChange({ type: 'bottom', rows: bottomRowsFromSizeLabels(labels), note: current.note })
    }
  }

  if (type === 'kurti') {
    const rows = current.type === 'kurti' ? current.rows : []
    return (
      <div className="border border-black/10 p-4 space-y-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <p className="font-body text-[12px] font-semibold uppercase tracking-[0.08em] text-black/70">
            Size guide (Kurti)
          </p>
          <button
            type="button"
            onClick={syncFromSizes}
            className="font-body text-[11px] uppercase tracking-[0.06em] text-black/55 hover:text-black"
          >
            Fill sizes from list above
          </button>
        </div>
        <p className="font-body text-[11px] text-black/40">
          Add bust and length in inches for each size — shown to customers under Select size.
        </p>
        <div className="overflow-x-auto">
          <div className="min-w-[520px] space-y-2">
            <div className="grid grid-cols-[100px_1fr_1fr_48px] gap-3 px-2">
              <span className="font-body text-[10px] uppercase tracking-[0.06em] text-black/45">Size</span>
              <span className="font-body text-[10px] uppercase tracking-[0.06em] text-black/45">Bust (inch)</span>
              <span className="font-body text-[10px] uppercase tracking-[0.06em] text-black/45">Length (inch)</span>
              <span />
            </div>
            {rows.map((row, idx) => (
              <div
                key={idx}
                className="grid grid-cols-[100px_1fr_1fr_48px] gap-3 items-center p-2 border border-black/10 bg-white"
              >
                <input
                  value={row.size}
                  onChange={(e) => updateKurtiRow(rows, idx, { size: e.target.value }, onChange, current)}
                  placeholder="e.g. M"
                  className="h-[38px] px-3 border border-black/10 font-body text-[13px]"
                />
                <input
                  value={row.bust}
                  onChange={(e) => updateKurtiRow(rows, idx, { bust: e.target.value }, onChange, current)}
                  placeholder="e.g. 38"
                  className="h-[38px] px-3 border border-black/10 font-body text-[13px]"
                />
                <input
                  value={row.length}
                  onChange={(e) => updateKurtiRow(rows, idx, { length: e.target.value }, onChange, current)}
                  placeholder="e.g. 41"
                  className="h-[38px] px-3 border border-black/10 font-body text-[13px]"
                />
                <button
                  type="button"
                  onClick={() => removeKurtiRow(rows, idx, onChange, current)}
                  className="font-body text-[12px] text-red-600 hover:text-red-700"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
        <button
          type="button"
          onClick={() =>
            onChange({
              type: 'kurti',
              rows: [...rows, { size: '', bust: '', length: '' }],
              note: current.note,
            })
          }
          className="font-body text-[11px] uppercase tracking-[0.06em] text-black/55 hover:text-black"
        >
          + Add row
        </button>
      </div>
    )
  }

  const rows = current.type === 'bottom' ? current.rows : []
  return (
    <div className="border border-black/10 p-4 space-y-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <p className="font-body text-[12px] font-semibold uppercase tracking-[0.08em] text-black/70">
          Size guide (Pant / Leggings / Palazzo)
        </p>
        <button
          type="button"
          onClick={syncFromSizes}
          className="font-body text-[11px] uppercase tracking-[0.06em] text-black/55 hover:text-black"
        >
          Fill sizes from list above
        </button>
      </div>
      <p className="font-body text-[11px] text-black/40">
        Add hip and length in inches for each size — shown to customers under Select size.
      </p>
      <div className="overflow-x-auto">
        <div className="min-w-[520px] space-y-2">
          <div className="grid grid-cols-[100px_1fr_1fr_48px] gap-3 px-2">
            <span className="font-body text-[10px] uppercase tracking-[0.06em] text-black/45">Size</span>
            <span className="font-body text-[10px] uppercase tracking-[0.06em] text-black/45">Hip (inch)</span>
            <span className="font-body text-[10px] uppercase tracking-[0.06em] text-black/45">Length (inch)</span>
            <span />
          </div>
          {rows.map((row, idx) => (
            <div
              key={idx}
              className="grid grid-cols-[100px_1fr_1fr_48px] gap-3 items-center p-2 border border-black/10 bg-white"
            >
              <input
                value={row.size}
                onChange={(e) => updateBottomRow(rows, idx, { size: e.target.value }, onChange, current)}
                placeholder="e.g. M"
                className="h-[38px] px-3 border border-black/10 font-body text-[13px]"
              />
              <input
                value={row.hip}
                onChange={(e) => updateBottomRow(rows, idx, { hip: e.target.value }, onChange, current)}
                placeholder="e.g. 28"
                className="h-[38px] px-3 border border-black/10 font-body text-[13px]"
              />
              <input
                value={row.length}
                onChange={(e) => updateBottomRow(rows, idx, { length: e.target.value }, onChange, current)}
                placeholder="e.g. 34"
                className="h-[38px] px-3 border border-black/10 font-body text-[13px]"
              />
              <button
                type="button"
                onClick={() => removeBottomRow(rows, idx, onChange, current)}
                className="font-body text-[12px] text-red-600 hover:text-red-700"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </div>
      <button
        type="button"
        onClick={() =>
          onChange({
            type: 'bottom',
            rows: [...rows, { size: '', hip: '', length: '' }],
            note: current.note,
          })
        }
        className="font-body text-[11px] uppercase tracking-[0.06em] text-black/55 hover:text-black"
      >
        + Add row
      </button>
    </div>
  )
}

function updateKurtiRow(
  rows: KurtiSizeGuideRow[],
  idx: number,
  patch: Partial<KurtiSizeGuideRow>,
  onChange: (g: SizeGuide | undefined) => void,
  current: SizeGuide
) {
  const next = rows.map((r, i) => (i === idx ? { ...r, ...patch } : r))
  onChange({ type: 'kurti', rows: next, note: current.type === 'kurti' ? current.note : undefined })
}

function removeKurtiRow(
  rows: KurtiSizeGuideRow[],
  idx: number,
  onChange: (g: SizeGuide | undefined) => void,
  current: SizeGuide
) {
  const next = rows.filter((_, i) => i !== idx)
  onChange(next.length ? { type: 'kurti', rows: next, note: current.type === 'kurti' ? current.note : undefined } : undefined)
}

function updateBottomRow(
  rows: BottomSizeGuideRow[],
  idx: number,
  patch: Partial<BottomSizeGuideRow>,
  onChange: (g: SizeGuide | undefined) => void,
  current: SizeGuide
) {
  const next = rows.map((r, i) => (i === idx ? { ...r, ...patch } : r))
  onChange({ type: 'bottom', rows: next, note: current.type === 'bottom' ? current.note : undefined })
}

function removeBottomRow(
  rows: BottomSizeGuideRow[],
  idx: number,
  onChange: (g: SizeGuide | undefined) => void,
  current: SizeGuide
) {
  const next = rows.filter((_, i) => i !== idx)
  onChange(
    next.length ? { type: 'bottom', rows: next, note: current.type === 'bottom' ? current.note : undefined } : undefined
  )
}
