// Placeholder ad slot. Once your AdSense account is approved, replace the
// inner <div> with your real <ins class="adsbygoogle"> unit and call
// (window.adsbygoogle = window.adsbygoogle || []).push({}) in a useEffect.
//
// variant="banner" -> wide horizontal space (between rows of posts)
// variant="side"   -> tall narrow space (left / right of the post grid, 160 x 600)
export default function AdSlot({ label = 'Advertisement', variant = 'banner' }) {
  return (
    <div className={`ad-slot ad-slot-${variant}`}>
      <span>{label}</span>
    </div>
  )
}