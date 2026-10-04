// A grey placeholder shown instead of the word "Loading...".
// It keeps the page the same height, so nothing jumps when the real content arrives.
export default function PageSkeleton({ inline = false }) {
  const body = (
    <div className="skel-grid" aria-hidden="true">
      <div className="skel skel-card" />
      <div className="skel skel-card" />
      <div className="skel skel-card" />
    </div>
  )
  if (inline) return body
  return (
    <div className="container container-wide" style={{ paddingTop: 40, paddingBottom: 80 }} role="status" aria-label="Loading">
      <div className="skel skel-line" style={{ width: 160, marginBottom: 22 }} />
      {body}
    </div>
  )
}