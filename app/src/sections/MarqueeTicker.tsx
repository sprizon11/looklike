export default function MarqueeTicker() {
  const message = "Free Shipping on Orders Above Rs. 499"
  const separator = (
    <span className="inline-block mx-6">
      <span className="inline-block w-[3px] h-[3px] bg-white rotate-45" />
    </span>
  )

  const content = (
    <>
      <span className="font-body text-[14px] font-medium uppercase tracking-[0.06em] text-white whitespace-nowrap">
        {message}
      </span>
      {separator}
      <span className="font-body text-[14px] font-medium uppercase tracking-[0.06em] text-white whitespace-nowrap">
        {message}
      </span>
      {separator}
      <span className="font-body text-[14px] font-medium uppercase tracking-[0.06em] text-white whitespace-nowrap">
        {message}
      </span>
      {separator}
      <span className="font-body text-[14px] font-medium uppercase tracking-[0.06em] text-white whitespace-nowrap">
        {message}
      </span>
      {separator}
    </>
  )

  return (
    <div className="w-full h-[50px] bg-black overflow-hidden flex items-center">
      <div
        className="inline-flex items-center whitespace-nowrap"
        style={{ animation: 'marquee-scroll 25s linear infinite' }}
      >
        {content}
        {content}
      </div>
    </div>
  )
}
