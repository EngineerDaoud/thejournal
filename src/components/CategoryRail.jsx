import { Link } from 'react-router-dom'
import { catLink, subLink } from '../lib/categories'

// Right-hand side panel next to the post grid: every category (with how many
// posts it has) and a cloud of trending topics (sub-categories / keywords).
export default function CategoryRail({ posts = [] }) {
  const cats = new Map()
  const topics = new Map()

  posts.forEach((p) => {
    const cat = p.category || 'General'
    cats.set(cat, (cats.get(cat) || 0) + 1)
    if (p.subcategory) {
      const key = `${cat}||${p.subcategory}`
      topics.set(key, (topics.get(key) || 0) + 1)
    }
  })

  const catList = [...cats.entries()].sort((a, b) => b[1] - a[1])
  const topicList = [...topics.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12)
    .map(([key, n]) => {
      const [cat, sub] = key.split('||')
      return { cat, sub, n }
    })

  if (catList.length === 0) return null

  return (
    <div className="cat-rail">
      <section className="cat-rail-box">
        <h3 className="cat-rail-title">Categories</h3>
        <ul className="cat-rail-list">
          {catList.map(([cat, n]) => (
            <li key={cat}>
              <Link to={catLink(cat)} className="cat-rail-link">
                <span>{cat}</span>
                <em>{n}</em>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {topicList.length > 0 && (
        <section className="cat-rail-box">
          <h3 className="cat-rail-title">Trending topics</h3>
          <div className="cat-rail-tags">
            {topicList.map((t) => (
              <Link key={`${t.cat}-${t.sub}`} to={subLink(t.cat, t.sub)} className="cat-rail-tag">
                {t.sub}
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}