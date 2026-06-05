import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { hasSizeGuide, type SizeGuide } from '@/lib/size-guide'

type Props = {
  guide: SizeGuide
}

export default function SizeGuidePanel({ guide }: Props) {
  const [open, setOpen] = useState(false)

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
            <SimpleChart
              title="Size chart"
              columns={[
                { key: 'size', label: 'Size', align: 'left' as const },
                { key: 'bust', label: 'Bust (inch)' },
                { key: 'length', label: 'Length (inch)' },
              ]}
              rows={guide.rows.map((r) => ({ size: r.size, bust: r.bust, length: r.length }))}
              note={guide.note}
            />
          ) : (
            <SimpleChart
              title="Size chart"
              columns={[
                { key: 'size', label: 'Size', align: 'left' as const },
                { key: 'hip', label: 'Hip (inches)' },
                { key: 'length', label: 'Length (inches)' },
              ]}
              rows={guide.rows.map((r) => ({ size: r.size, hip: r.hip, length: r.length }))}
              note={guide.note}
            />
          )}
        </div>
      )}
    </div>
  )
}

function SimpleChart({
  title,
  columns,
  rows,
  note,
}: {
  title: string
  columns: { key: string; label: string; align?: 'left' | 'center' }[]
  rows: Record<string, string>[]
  note?: string
}) {
  return (
    <div className="pt-4">
      <p className="font-display text-[22px] text-black tracking-[-0.02em]">{title}</p>
      <div className="gold-divider mt-3 w-[100px]" />
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[280px] border-collapse font-body text-[13px]">
          <thead>
            <tr className="bg-black text-gold-light">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-3 py-2.5 font-medium uppercase tracking-[0.06em] text-[11px] border border-black/20 ${
                    col.align === 'left' ? 'text-left' : 'text-center'
                  }`}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={`${row.size}-${i}`} className={i % 2 === 0 ? 'bg-white' : 'bg-[#f3f1ec]'}>
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={`px-3 py-2.5 border border-black/10 ${
                      col.key === 'size'
                        ? 'font-medium text-black'
                        : 'text-center text-black/80'
                    } ${col.align === 'left' ? 'text-left' : ''}`}
                  >
                    {row[col.key]?.trim() || '—'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {note ? <p className="font-body text-[11px] text-black/45 mt-3 italic">{note}</p> : null}
    </div>
  )
}
