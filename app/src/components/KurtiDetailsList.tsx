import type { KurtiDetails } from '@/lib/kurti-details'

type KurtiDetailsListProps = {
  details: KurtiDetails
  className?: string
}

function Row({ label, value }: { label: string; value: string }) {
  if (!value) return null
  return (
    <li className="font-body text-[15px] text-[#212121]/90">
      <span className="font-semibold text-[#212121]">{label} :</span> {value}
    </li>
  )
}

export default function KurtiDetailsList({ details, className = '' }: KurtiDetailsListProps) {
  return (
    <ul className={`space-y-1.5 ${className}`} aria-label="Product details">
      <Row label="Fabric" value={details.fabric} />
      <Row label="Lining" value={details.lining} />
      <Row label="Style" value={details.style} />
      <Row label="Color" value={details.color} />
      <Row label="Length" value={details.length} />
      <Row label="Pocket" value={details.pocket} />
    </ul>
  )
}
