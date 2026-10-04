import { Fragment } from 'react'
import PostCard from './PostCard'
import AdSlot from './AdSlot'
import CategoryRail from './CategoryRail'

// 3 posts per row. After every `adEvery` rows a banner ad space is inserted
// (only when more posts follow). On wide screens the right side lists the categories + trending topics
// and keeps an ad space (Google AdSense) below them.
export default function PostGrid({ posts, allPosts, perRow = 3, adEvery = 3, sideAds = true }) {
  const chunk = perRow * adEvery
  return (
    <div className={`grid-with-rails${sideAds ? ' has-rails' : ''}`}>
      <div className="grid-main">
        {posts.map((post, i) => (
          <Fragment key={post.id}>
            {i > 0 && i % chunk === 0 && (
              <div className="grid-ad-row">
                <AdSlot variant="banner" />
              </div>
            )}
            {/* each group of rows is its own grid so the banner spans the full width */}
            {i % chunk === 0 && (
              <div className={`card-grid-3${perRow === 4 ? ' card-grid-4' : ''}`}>
                {posts.slice(i, i + chunk).map((p) => (
                  <PostCard key={p.id} post={p} />
                ))}
              </div>
            )}
          </Fragment>
        ))}
      </div>

      {sideAds && (
        <aside className="grid-rail grid-rail-right" aria-label="Categories">
          <CategoryRail posts={allPosts || posts} />
          <AdSlot variant="rect" />
        </aside>
      )}
    </div>
  )
}