import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { loadCategoryTree, getCachedCategoryTree } from '../lib/categories'
import { submitArticle, countWords, slugify } from '../lib/submissions'
import BlockEditor, { newTextBlock } from '../components/BlockEditor'
import Dropdown from '../components/Dropdown'
import KeywordsInput from '../components/KeywordsInput'
import ArticlePreview from '../components/ArticlePreview'
import { authorInitial } from '../lib/siteConfig'
import { supabase } from '../lib/supabaseClient'
import { imagePath } from '../lib/upload'

const MIN_WORDS = 800
const MAX_WORDS = 2000
const MAX_COVERS = 4
const COUNTRIES = [
  'Afghanistan',
  'Albania',
  'Algeria',
  'Andorra',
  'Angola',
  'Argentina',
  'Armenia',
  'Australia',
  'Austria',
  'Azerbaijan',
  'Bahamas',
  'Bahrain',
  'Bangladesh',
  'Barbados',
  'Belarus',
  'Belgium',
  'Belize',
  'Benin',
  'Bhutan',
  'Bolivia',
  'Bosnia and Herzegovina',
  'Botswana',
  'Brazil',
  'Brunei',
  'Bulgaria',
  'Burkina Faso',
  'Burundi',
  'Cambodia',
  'Cameroon',
  'Canada',
  'Cape Verde',
  'Central African Republic',
  'Chad',
  'Chile',
  'China',
  'Colombia',
  'Comoros',
  'Congo',
  'Costa Rica',
  'Croatia',
  'Cuba',
  'Cyprus',
  'Czech Republic',
  'Denmark',
  'Djibouti',
  'Dominican Republic',
  'DR Congo',
  'Ecuador',
  'Egypt',
  'El Salvador',
  'Estonia',
  'Eswatini',
  'Ethiopia',
  'Fiji',
  'Finland',
  'France',
  'Gabon',
  'Gambia',
  'Georgia',
  'Germany',
  'Ghana',
  'Greece',
  'Guatemala',
  'Guinea',
  'Guyana',
  'Haiti',
  'Honduras',
  'Hong Kong',
  'Hungary',
  'Iceland',
  'India',
  'Indonesia',
  'Iran',
  'Iraq',
  'Ireland',
  'Israel',
  'Italy',
  'Ivory Coast',
  'Jamaica',
  'Japan',
  'Jordan',
  'Kazakhstan',
  'Kenya',
  'Kuwait',
  'Kyrgyzstan',
  'Laos',
  'Latvia',
  'Lebanon',
  'Lesotho',
  'Liberia',
  'Libya',
  'Lithuania',
  'Luxembourg',
  'Madagascar',
  'Malawi',
  'Malaysia',
  'Maldives',
  'Mali',
  'Malta',
  'Mauritania',
  'Mauritius',
  'Mexico',
  'Moldova',
  'Monaco',
  'Mongolia',
  'Montenegro',
  'Morocco',
  'Mozambique',
  'Myanmar',
  'Namibia',
  'Nepal',
  'Netherlands',
  'New Zealand',
  'Nicaragua',
  'Niger',
  'Nigeria',
  'North Korea',
  'North Macedonia',
  'Norway',
  'Oman',
  'Pakistan',
  'Palestine',
  'Panama',
  'Papua New Guinea',
  'Paraguay',
  'Peru',
  'Philippines',
  'Poland',
  'Portugal',
  'Qatar',
  'Romania',
  'Russia',
  'Rwanda',
  'Saudi Arabia',
  'Senegal',
  'Serbia',
  'Sierra Leone',
  'Singapore',
  'Slovakia',
  'Slovenia',
  'Somalia',
  'South Africa',
  'South Korea',
  'South Sudan',
  'Spain',
  'Sri Lanka',
  'Sudan',
  'Suriname',
  'Sweden',
  'Switzerland',
  'Syria',
  'Taiwan',
  'Tajikistan',
  'Tanzania',
  'Thailand',
  'Togo',
  'Trinidad and Tobago',
  'Tunisia',
  'Turkey',
  'Turkmenistan',
  'Uganda',
  'Ukraine',
  'United Arab Emirates',
  'United Kingdom',
  'United States',
  'Uruguay',
  'Uzbekistan',
  'Venezuela',
  'Vietnam',
  'Yemen',
  'Zambia',
  'Zimbabwe',
]


const SIZE = 128 // px, square

// Shrinks and crops any picked image down to a small square JPEG (data URL).
function resizeToSquareDataUrl(file) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const reader = new FileReader()
    reader.onerror = reject
    reader.onload = () => {
      img.onerror = reject
      img.onload = () => {
        const side = Math.min(img.width, img.height)
        const sx = (img.width - side) / 2
        const sy = (img.height - side) / 2
        const canvas = document.createElement('canvas')
        canvas.width = SIZE
        canvas.height = SIZE
        canvas.getContext('2d').drawImage(img, sx, sy, side, side, 0, 0, SIZE, SIZE)
        resolve(canvas.toDataURL('image/jpeg', 0.85))
      }
      img.src = reader.result
    }
    reader.readAsDataURL(file)
  })
}

// Same look as the admin's author picture (round avatar + small camera button),
// but for readers: the picture is kept in the form and sent with the article.
// It only becomes the public author picture after the editor approves the article.
function ReaderAvatarPicker({ name, value, onChange }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef(null)
  const cleanName = (name || '').trim()

  async function handleFile(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file.')
      return
    }
    setBusy(true)
    setError('')
    try {
      onChange(await resizeToSquareDataUrl(file))
    } catch {
      setError('Could not read that image.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div style={{ position: 'relative', width: 44, height: 44, flex: '0 0 auto' }}>
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: '50%',
          border: '1px solid var(--color-line)',
          overflow: 'hidden',
          background: value ? 'transparent' : 'var(--color-accent-soft)',
          display: 'grid',
          placeItems: 'center',
        }}
      >
        {value ? (
          <img src={value} alt={cleanName || 'Author'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-accent)' }}>
            {cleanName ? authorInitial(cleanName) : '?'}
          </span>
        )}
      </div>

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        title={value ? 'Change your picture' : 'Add your picture'}
        aria-label={value ? 'Change your picture' : 'Add your picture'}
        style={{
          position: 'absolute',
          right: -2,
          bottom: -2,
          width: 18,
          height: 18,
          borderRadius: '50%',
          display: 'grid',
          placeItems: 'center',
          background: 'var(--color-ink)',
          border: '2px solid var(--color-bg)',
          color: 'var(--color-bg)',
          cursor: busy ? 'default' : 'pointer',
          padding: 0,
        }}
      >
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
          <circle cx="12" cy="13" r="4" />
        </svg>
      </button>

      <input ref={inputRef} type="file" accept="image/*" onChange={handleFile} style={{ display: 'none' }} />

      {value && (
        <button
          type="button"
          onClick={() => onChange(null)}
          title="Remove picture"
          aria-label="Remove picture"
          style={{
            position: 'absolute',
            left: -2,
            top: -2,
            width: 16,
            height: 16,
            borderRadius: '50%',
            border: '2px solid var(--color-bg)',
            background: 'var(--color-ink)',
            color: 'var(--color-bg)',
            fontSize: 10,
            lineHeight: 1,
            padding: 0,
            cursor: 'pointer',
          }}
        >
          &times;
        </button>
      )}

      {error && (
        <span style={{ position: 'absolute', top: '100%', right: 0, marginTop: 4, fontSize: 11, color: 'var(--color-danger)', whiteSpace: 'nowrap' }}>
          {error}
        </span>
      )}
    </div>
  )
}

export default function WriteArticle() {
  const [tree, setTree] = useState(() => getCachedCategoryTree() || [])
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const slugTouched = useRef(false)
  const [authorName, setAuthorName] = useState('')
  const [authorAvatar, setAuthorAvatar] = useState(null) // small square picture (data URL)
  const [readingTime, setReadingTime] = useState('')
  const [searchIntent, setSearchIntent] = useState([])
  const [targetAudience, setTargetAudience] = useState([])
  const [email, setEmail] = useState('')
  const [country, setCountry] = useState('')
  const [askEmail, setAskEmail] = useState(false) // the small popup that asks for email + country
  const [category, setCategory] = useState('')
  const [customCategory, setCustomCategory] = useState('')
  const [excerpt, setExcerpt] = useState('')
  const [tldr, setTldr] = useState('')
  const [blocks, setBlocks] = useState(() => [newTextBlock('')])
  const [coverImages, setCoverImages] = useState([])
  const [coverMeta, setCoverMeta] = useState({}) // { imageUrl: { alt, title, caption } }
  const [coverBusy, setCoverBusy] = useState(false)
  const [primaryKw, setPrimaryKw] = useState([])
  const [secondaryKw, setSecondaryKw] = useState([])
  const coverInputRef = useRef(null)
  const [trap, setTrap] = useState('') // hidden field: only bots fill it in
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)
  const [showPreview, setShowPreview] = useState(false)

  useEffect(() => {
    document.title = 'Write for us — The Journal'
    loadCategoryTree().then(setTree)
  }, [])

  const words = countWords(blocks)

  function handleTitleChange(value) {
    setTitle(value)
    if (!slugTouched.current) setSlug(slugify(value))
  }

  // Same as the admin editor: upload up to MAX_COVERS cover images (readers' go to submissions/).
  async function handleCoverUpload(fileList) {
    const all = Array.from(fileList || [])
    const room = MAX_COVERS - coverImages.length
    const files = all.slice(0, Math.max(0, room))
    if (all.length > files.length) alert(`Only ${MAX_COVERS} cover images are allowed.`)
    if (!files.length) return
    setCoverBusy(true)
    const added = []
    for (const file of files) {
      const { path, error: badFile } = imagePath(file, 'submissions/')
      if (badFile) {
        alert('Cover upload failed: ' + badFile)
        continue
      }
      const { error: upErr } = await supabase.storage.from('blog-images').upload(path, file, { contentType: file.type })
      if (upErr) {
        alert('Cover upload failed: ' + upErr.message)
        continue
      }
      added.push(supabase.storage.from('blog-images').getPublicUrl(path).data.publicUrl)
    }
    if (added.length) setCoverImages((prev) => [...prev, ...added])
    setCoverBusy(false)
  }

  function setMeta(url, field, value) {
    setCoverMeta((prev) => ({ ...prev, [url]: { ...(prev[url] || {}), [field]: value } }))
  }

  // Step 1: check the article, then ask for the email in a small popup.
  function handleSend() {
    setError('')
    const finalCategory = category === '__other' ? customCategory.trim() : category
    if (title.trim().length < 5) return setError('Please write a title (at least 5 characters).')
    if (authorName.trim().length < 2) return setError('Please enter your name.')
    if (!finalCategory) return setError('Please choose a category.')
    if (!slug.trim()) return setError('Please add a URL slug.')
    if (words < MIN_WORDS) return setError(`Your article needs at least ${MIN_WORDS} words (now ${words}).`)
    if (words > MAX_WORDS) return setError(`Your article can have at most ${MAX_WORDS} words (now ${words}).`)
    setAskEmail(true)
  }

  // Step 2: email + country were entered in the popup; now really send it.
  async function handleConfirmSend() {
    setError('')
    const finalCategory = category === '__other' ? customCategory.trim() : category
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setError('Please enter a valid email address.')
    if (country.trim().length < 2) return setError('Please enter your country.')

    if (trap) {
      // A bot: pretend it worked.
      setAskEmail(false)
      setSent(true)
      return
    }

    setBusy(true)
    const result = await submitArticle({
      title,
      slug,
      authorName,
      authorAvatar,
      readingTime,
      searchIntent,
      targetAudience,
      email,
      country,
      category: finalCategory,
      excerpt,
      tldr,
      blocks,
      coverImages,
      coverMeta,
      primaryKw,
      secondaryKw,
    })
    setBusy(false)

    if (!result.ok) return setError(result.error)
    setAskEmail(false)
    setSent(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (sent) {
    return (
      <div className="measure" style={{ paddingTop: 70, paddingBottom: 80 }}>
        <h1 style={{ fontSize: 30 }}>Thank you!</h1>
        <p style={{ fontSize: 17, lineHeight: 1.6 }}>
          Your article was sent for approval. It will appear on the site only after the editor has
          read and approved it.
        </p>
        <div style={{ display: 'flex', gap: 12, marginTop: 26, flexWrap: 'wrap' }}>
          <Link to="/blog" className="btn">
            Back to articles
          </Link>
          <button
            className="btn btn-outline"
            onClick={() => {
              setTitle('')
              setSlug('')
              slugTouched.current = false
              setReadingTime('')
              setSearchIntent([])
              setTargetAudience([])
              setExcerpt('')
              setTldr('')
              setCoverImages([])
              setCoverMeta({})
              setPrimaryKw([])
              setSecondaryKw([])
              setBlocks([newTextBlock('')])
              setSent(false)
            }}
          >
            Write another article
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="container" style={{ paddingTop: 48, paddingBottom: 90 }}>
      <h1 style={{ fontSize: 30, marginBottom: 8 }}>Write for us</h1>
      <p style={{ color: 'var(--color-ink-soft)', fontSize: 15, marginBottom: 30 }}>
        Write your article below and send it for approval. It is published only after the editor
        approves it.
      </p>

      <section
        aria-labelledby="w-guide-title"
        style={{
          border: '1px solid var(--color-line)',
          borderRadius: 'var(--radius-md)',
          padding: '20px 24px',
          marginBottom: 34,
        }}
      >
        <h2 id="w-guide-title" style={{ fontSize: 20, margin: '0 0 10px' }}>
          Before you write
        </h2>
        <ul style={{ margin: '0 0 14px', paddingLeft: 22, fontSize: 15, lineHeight: 1.65, color: 'var(--color-ink-soft)', textAlign: 'justify' }}>
          <li>Write an original article in your own words. Copied or spun text is rejected.</li>
          <li>Write between {MIN_WORDS} and {MAX_WORDS} words. Clear, useful and well-structured articles are approved faster.</li>
          <li>Check your facts, names and numbers. Name your sources when you use them.</li>
          <li>Add a clear title, a short excerpt, a category and keywords so readers and search engines can find it.</li>
          <li>Use only images you have the right to use, and add alt text to your cover images.</li>
          <li>Our editor may change small things such as spelling or formatting before publishing.</li>
        </ul>
        <p
          style={{
            margin: '0 0 12px',
            padding: '12px 16px',
            fontSize: 15,
            lineHeight: 1.6,
            fontWeight: 600,
            textAlign: 'justify',
            color: 'var(--color-ink)',
            background: 'var(--color-accent-soft)',
            borderLeft: '3px solid var(--color-accent)',
            borderRadius: 'var(--radius)',
          }}
        >
          Reward: if your article gets a lot of hits and readers, you can earn a reward from us.
          The better your article performs, the better your chance.
        </p>
        <p style={{ margin: 0, fontSize: 14, color: 'var(--color-ink-soft)' }}>
          Want the full details? Read our{' '}
          <Link className="underline-link" to="/writer-guidelines">
            Writer Guidelines &amp; Rewards
          </Link>
          .
        </p>
      </section>

      <div className="field-compact">
        <div className="field field-title">
          <label htmlFor="w-title">Title</label>
          <input id="w-title" type="text" value={title} maxLength={160} onChange={(e) => handleTitleChange(e.target.value)} />
        </div>

        <div className="field-grid" style={{ marginBottom: 14 }}>
          <div className="field">
            <label htmlFor="w-slug">URL slug</label>
            <input
              id="w-slug"
              type="text"
              value={slug}
              maxLength={120}
              onChange={(e) => {
                slugTouched.current = true
                setSlug(slugify(e.target.value))
              }}
            />
          </div>

          <div className="field">
            <label htmlFor="w-name">Author (your name, shown on the article)</label>
            <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <input
                  id="w-name"
                  type="text"
                  placeholder="Your name"
                  value={authorName}
                  maxLength={80}
                  onChange={(e) => setAuthorName(e.target.value)}
                />
              </div>
              <ReaderAvatarPicker name={authorName} value={authorAvatar} onChange={setAuthorAvatar} />
            </div>
          </div>

          <div className="field">
            <label htmlFor="w-cat">Category</label>
            <Dropdown
              id="w-cat"
              value={category}
              onChange={setCategory}
              placeholder="Select a category"
              options={[
                ...tree.map((c) => ({ value: c.name, label: c.name })),
                { value: '__other', label: 'Other…' },
              ]}
            />
            {category === '__other' && (
              <input
                type="text"
                style={{ marginTop: 10 }}
                placeholder="Type the category"
                value={customCategory}
                maxLength={80}
                onChange={(e) => setCustomCategory(e.target.value)}
              />
            )}

            <div style={{ marginTop: 14 }}>
              <label htmlFor="w-reading-time">Estimated reading time (minutes)</label>
              <input
                id="w-reading-time"
                type="number"
                min="1"
                max="240"
                inputMode="numeric"
                placeholder="e.g. 5 (leave empty to hide)"
                value={readingTime}
                onChange={(e) => setReadingTime(e.target.value)}
              />
            </div>

            <div className="field" style={{ marginTop: 14 }}>
            <label>Cover images (optional)</label>
            <div className="cover-thumbs">
              {coverImages.map((url, i) => (
                <div className="cover-thumb" key={`${url}-${i}`}>
                  <img src={url} alt="" draggable={false} />
                  <span className="cover-thumb-n">{i + 1}</span>
                  <button
                    type="button"
                    className="cover-thumb-x"
                    title="Remove this image"
                    onClick={() => setCoverImages((prev) => prev.filter((_, idx) => idx !== i))}
                  >
                    &times;
                  </button>
                </div>
              ))}
              {coverImages.length < MAX_COVERS ? (
                <button
                  type="button"
                  className="btn btn-outline"
                  style={{ whiteSpace: 'nowrap' }}
                  disabled={coverBusy}
                  onClick={() => coverInputRef.current?.click()}
                >
                  {coverBusy ? 'Uploading...' : coverImages.length ? '+ Add more images' : 'Upload images'}
                </button>
              ) : (
                <span style={{ fontSize: 12, color: 'var(--color-ink-soft)' }}>Maximum {MAX_COVERS} images</span>
              )}
            </div>
            <p className="cover-hint">
              <strong>Best size: 1600 x 900 px (16:9)</strong> &middot; JPG, PNG or WEBP &middot; ideally under
              500 KB (hard limit 10 MB). Other shapes are not cropped, they are fitted inside the frame.
            </p>

            {coverImages.length > 0 && (
              <details className="img-seo">
                <summary>
                  Image SEO: alt text, title, caption
                  {coverImages.some((u) => !(coverMeta[u]?.alt || '').trim()) && (
                    <span className="img-seo-warn"> · alt text missing</span>
                  )}
                </summary>
                <p className="img-seo-hint">
                  <strong>Alt text</strong> is the important one: describe the image in one short sentence.
                  Title and caption are optional.
                </p>
                {coverImages.map((url, i) => (
                  <div className="img-seo-row" key={`${url}-${i}`}>
                    <img src={url} alt="" />
                    <div className="img-seo-fields">
                      <input
                        type="text"
                        placeholder={`Image ${i + 1} alt text (describe the image)`}
                        value={coverMeta[url]?.alt || ''}
                        maxLength={200}
                        onChange={(e) => setMeta(url, 'alt', e.target.value)}
                      />
                      <input
                        type="text"
                        placeholder="Image title (optional, shown on hover)"
                        value={coverMeta[url]?.title || ''}
                        maxLength={120}
                        onChange={(e) => setMeta(url, 'title', e.target.value)}
                      />
                      <input
                        type="text"
                        placeholder="Caption under the image (optional)"
                        value={coverMeta[url]?.caption || ''}
                        maxLength={300}
                        onChange={(e) => setMeta(url, 'caption', e.target.value)}
                      />
                    </div>
                  </div>
                ))}
              </details>
            )}

            <input
              ref={coverInputRef}
              type="file"
              accept="image/*"
              multiple
              hidden
              onChange={(e) => {
                handleCoverUpload(e.target.files)
                e.target.value = ''
              }}
            />
            </div>
          </div>

          <div className="field kw-admin">
            <label>Keywords (optional)</label>
            <div className="kw-admin-box">
              <div className="kw-admin-row">
                <div className="kw-admin-name">Primary</div>
                <KeywordsInput value={primaryKw} onChange={setPrimaryKw} />
              </div>
              <div className="kw-admin-row">
                <div className="kw-admin-name">Secondary</div>
                <KeywordsInput value={secondaryKw} onChange={setSecondaryKw} />
              </div>
            </div>
          </div>

        </div>

        <div className="field-grid field-grid-3 field-compact">
          <div className="field">
            <label htmlFor="w-excerpt">
              Short excerpt (shown in article listing)
              <span style={{ float: 'right', color: excerpt.length > 160 ? 'var(--color-danger)' : 'var(--color-ink-soft)' }}>{excerpt.length} / 160</span>
            </label>
            <textarea
              id="w-excerpt"
              rows={3}
              maxLength={160}
              placeholder="One or two sentences that make people want to open the article"
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              style={{ resize: 'vertical', height: 126, minHeight: 126, boxSizing: 'border-box' }}
            />
          </div>
          <div className="field">
            <label>Search Intent</label>
            <KeywordsInput value={searchIntent} onChange={setSearchIntent} placeholder="Type and press Enter" minHeight={126} />
          </div>
          <div className="field">
            <label>Target Audience</label>
            <KeywordsInput value={targetAudience} onChange={setTargetAudience} placeholder="Type and press Enter" minHeight={126} />
          </div>
        </div>
      </div>

      <div className="field" style={{ marginTop: 26 }}>
        <label style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Article</span>
          <span style={{ color: words >= MIN_WORDS && words <= MAX_WORDS ? 'var(--color-ink-soft)' : 'var(--color-danger)' }}>
            {words} words ({MIN_WORDS} to {MAX_WORDS} allowed)
          </span>
        </label>
        <BlockEditor blocks={blocks} onChange={setBlocks} tldr={tldr} onTldrChange={setTldr} restricted />
      </div>

      {/* Hidden from people; bots tend to fill every field */}
      <input
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        value={trap}
        onChange={(e) => setTrap(e.target.value)}
        style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, opacity: 0 }}
      />

      {error && !askEmail && (
        <p role="alert" style={{ color: 'var(--color-danger)', fontSize: 14, marginBottom: 14 }}>
          {error}
        </p>
      )}

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <button type="button" className="btn" onClick={handleSend}>
          Send for approval
        </button>
        <button type="button" className="btn btn-outline" onClick={() => setShowPreview(true)}>
          Preview article
        </button>
      </div>

      {showPreview && (
        <ArticlePreview
          title={title}
          author={authorName}
          category={category === '__other' ? customCategory.trim() : category}
          readingTime={readingTime}
          tldr={tldr}
          blocks={blocks}
          coverImages={coverImages}
          coverMeta={coverMeta}
          onClose={() => setShowPreview(false)}
        />
      )}

      {askEmail && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="w-popup-title"
          onClick={(e) => {
            if (e.target === e.currentTarget && !busy) setAskEmail(false)
          }}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
            zIndex: 1000,
          }}
        >
          <div
            style={{
              background: 'var(--color-bg, #fff)',
              border: '1px solid var(--color-line)',
              borderRadius: 'var(--radius-md)',
              padding: 26,
              width: '100%',
              maxWidth: 440,
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
          >
            <h2 id="w-popup-title" style={{ fontSize: 22, margin: '0 0 8px' }}>
              One last step
            </h2>
            <p style={{ fontSize: 14, color: 'var(--color-ink-soft)', lineHeight: 1.55, marginBottom: 18 }}>
              Write your email ID for more convenience. We will use it only to send you review and
              feedback about your article. It will not be shown on the article.
            </p>

            <div className="field">
              <label htmlFor="w-email">Your email ID</label>
              <input
                id="w-email"
                type="email"
                autoFocus
                value={email}
                maxLength={160}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="field">
              <label htmlFor="w-country">Your country</label>
              <input
                id="w-country"
                type="text"
                list="w-countries"
                value={country}
                maxLength={80}
                onChange={(e) => setCountry(e.target.value)}
              />
              <datalist id="w-countries">
                {COUNTRIES.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>

            {error && (
              <p role="alert" style={{ color: 'var(--color-danger)', fontSize: 14, marginBottom: 12 }}>
                {error}
              </p>
            )}

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button type="button" className="btn" onClick={handleConfirmSend} disabled={busy}>
                {busy ? 'Sending…' : 'Send for approval'}
              </button>
              <button type="button" className="btn btn-outline" onClick={() => setAskEmail(false)} disabled={busy}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}