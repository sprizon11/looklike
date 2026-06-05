import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import {
  formatGuideMeasure,
  hasSizeGuide,
  type BottomSizeGuideRow,
  type SizeGuide,
} from '@/lib/size-guide'

type Props = {
  guide: SizeGuide
}

export default function SizeGuidePanel({ guide }: Props) {
  const [open, setOpen] = useState(false)
  const [unit, setUnit] = useState<'in' | 'cm'>('in')

  if (!hasSizeGuide(guide)) return null

  return (
    <div className="mt-4 border border-black/10 bg-[#fafafa]">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-black/[0.02] transition-colors"
        aria-expanded={open}
      >
        <span className="font-body text-[13px] font-medium text-black">Size guide</span>
        <ChevronDown
          size={18}
          className={`shrink-0 text-black/45 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="px-4 pb-4 border-t border-black/[0.06]">
          {guide.type === 'kurti' ? (
            <KurtiChart guide={guide} />
          ) : (
            <BottomChart guide={guide} unit={unit} onUnit={setUnit} />
          )}
        </div>
      )}
    </div>
  )
}

function KurtiChart({ guide }: { guide: Extract<SizeGuide, { type: 'kurti' }> }) {
  return (
    <div className="pt-4">
      <p className="font-display text-[22px] text-black tracking-[-0.02em]">Size chart</p>
      <div className="gold-divider mt-3 w-[100px]" />
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[280px] border-collapse font-body text-[13px]">
          <thead>
            <tr className="bg-black text-gold-light">
              <th className="px-3 py-2.5 text-left font-medium uppercase tracking-[0.06em] text-[11px] border border-black/20">
                Size
              </th>
              <th className="px-3 py-2.5 text-center font-medium uppercase tracking-[0.06em] text-[11px] border border-black/20">
                Bust (inch)
              </th>
              <th className="px-3 py-2.5 text-center font-medium uppercase tracking-[0.06em] text-[11px] border border-black/20">
                Length (inch)
              </th>
            </tr>
          </thead>
          <tbody>
            {guide.rows.map((row, i) => (
              <tr key={`${row.size}-${i}`} className={i % 2 === 0 ? 'bg-white' : 'bg-[#f3f1ec]'}>
                <td className="px-3 py-2.5 font-medium text-black border border-black/10">{row.size}</td>
                <td className="px-3 py-2.5 text-center text-black/80 border border-black/10">
                  {row.bust || '—'}
                </td>
                <td className="px-3 py-2.5 text-center text-black/80 border border-black/10">
                  {row.length || '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {guide.note ? (
        <p className="font-body text-[11px] text-black/45 mt-3 italic">{guide.note}</p>
      ) : null}
    </div>
  )
}

function BottomChart({
  guide,
  unit,
  onUnit,
}: {
  guide: Extract<SizeGuide, { type: 'bottom' }>
  unit: 'in' | 'cm'
  onUnit: (u: 'in' | 'cm') => void
}) {
  const rows = guide.rows
  const measureRows: { key: string; label: string; pick: (r: BottomSizeGuideRow) => string | undefined }[] =
    [
      { key: 'brand', label: 'Brand size', pick: (r: BottomSizeGuideRow) => r.brandSize },
      { key: 'in', label: 'IN size', pick: (r: BottomSizeGuideRow) => r.inSize },
      { key: 'waist', label: 'Waist', pick: (r: BottomSizeGuideRow) => r.waist },
      { key: 'hip', label: 'Hip', pick: (r: BottomSizeGuideRow) => r.hip },
      { key: 'inseam', label: 'Inseam', pick: (r: BottomSizeGuideRow) => r.inseam },
      { key: 'length', label: 'Length', pick: (r: BottomSizeGuideRow) => r.length },
    ].filter((m) => m.key === 'brand' || m.key === 'in' || rows.some((r: BottomSizeGuideRow) => m.pick(r)?.trim()))

  return (
    <div className="pt-4">
      <div className="flex items-center justify-between gap-3 mb-3">
        <p className="font-body text-[12px] uppercase tracking-[0.08em] text-black/50">Measurements</p>
        <div className="inline-flex rounded-full border border-black/15 p-0.5 bg-white text-[11px] font-body">
          <button
            type="button"
            onClick={() => onUnit('in')}
            className={`px-3 py-1 rounded-full transition-colors ${
              unit === 'in' ? 'bg-black text-gold-light' : 'text-black/55 hover:text-black'
            }`}
          >
            in
          </button>
          <button
            type="button"
            onClick={() => onUnit('cm')}
            className={`px-3 py-1 rounded-full transition-colors ${
              unit === 'cm' ? 'bg-black text-gold-light' : 'text-black/55 hover:text-black'
            }`}
          >
            cm
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[320px] border-collapse font-body text-[12px]">
          <thead>
            <tr className="border-b border-black/10">
              <th className="px-2 py-2 text-left text-black/45 font-normal w-[88px]" />
              {rows.map((col) => (
                <th
                  key={col.size}
                  className="px-2 py-2 text-center font-medium text-black whitespace-nowrap"
                >
                  Size {col.size}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {measureRows.map((m) => (
              <tr key={m.key} className="border-b border-black/[0.06]">
                <td className="px-2 py-2.5 text-black/55 whitespace-nowrap">{m.label}</td>
                {rows.map((col) => {
                  const raw = m.pick(col) || ''
                  const display =
                    m.key === 'brand' || m.key === 'in'
                      ? raw || '—'
                      : formatGuideMeasure(raw, unit)
                  return (
                    <td key={`${col.size}-${m.key}`} className="px-2 py-2.5 text-center text-black">
                      {display}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {guide.note ? (
        <p className="font-body text-[11px] text-black/45 mt-3">{guide.note}</p>
      ) : (
        <p className="font-body text-[11px] text-black/45 mt-3">
          * Measurements stored in inches; cm shown when selected.
        </p>
      )}
    </div>
  )
}
