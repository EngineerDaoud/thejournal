import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { parseMarkdownBlog, postToMarkdown } from '../lib/parseBlog'
import BlockEditor, { newTextBlock } from '../components/BlockEditor'
import Dropdown from '../components/Dropdown'
import { parseCovers, serializeCovers } from '../lib/covers'
import AuthorAvatarPicker from '../components/AuthorAvatarPicker'
import KeywordsInput from '../components/KeywordsInput'
import { splitKeywords, joinKeywords } from '../lib/keywords'
import { imagePath } from '../lib/upload'
const MAX_COVERS = 4

function slugify(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

export default function AdminEditor() {
  const { id } = useParams()
  const isEditing = Boolean(id)
  const navigate = useNavigate()

  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [excerpt, setExcerpt] = useState('')
  const [primaryKw, setPrimaryKw] = useState([])
  const [secondaryKw, setSecondaryKw] = useState([])
  const [tldr, setTldr] = useState('')
  const [ctaText, setCtaText] = useState('')
  const [ctaLink, setCtaLink] = useState('')
  const [coverImages, setCoverImages] = useState([])
  const [category, setCategory] = useState('')
  const [existingCategories, setExistingCategories] = useState([])
  const [addingNewCategory, setAddingNewCategory] = useState(false)
  const [catTree, setCatTree] = useState([])
  const [subcategory, setSubcategory] = useState('')
  const [addingNewSub, setAddingNewSub] = useState(false)
  const [postCatsLoaded, setPostCatsLoaded] = useState(false)
  const [treeLoaded, setTreeLoaded] = useState(false)
  const [published, setPublished] = useState(false)
  const [author, setAuthor] = useState('')
  const [existingAuthors, setExistingAuthors] = useState([])
  const [addingNewAuthor, setAddingNewAuthor] = useState(false)
  const [mode, setMode] = useState(isEditing ? 'custom' : null)
  const [blocks, setBlocks] = useState([newTextBlock('')])
  const [loading, setLoading] = useState(isEditing)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [pasteText, setPasteText] = useState('')
  const [pasteMsg, setPasteMsg] = useState('')
  const [copied, setCopied] = useState(false)
  const [coverBusy, setCoverBusy] = useState(false)
  const slugTouched = useRef(false)
  const coverInputRef = useRef(null)

  useEffect(() => {
    supabase
      .from('posts')
      .select('category')
      .then(({ data }) => {
        if (!data) return
        const seen = new Set()
        const list = []
        for (const row of data) {
          const cat = row.category || 'General'
          if (!seen.has(cat)) {
            seen.add(cat)
            list.push(cat)
          }
        }
        setExistingCategories(list)
      })
      .finally(() => setPostCatsLoaded(true))
  }, [])

  useEffect(() => {
    supabase
      .from('categories')
      .select('id, name, parent_id, sort_order')
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true })
      .then(({ data }) => {
        if (!data) return
        setCatTree(
          data
            .filter((r) => !r.parent_id)
            .map((p) => ({
              name: p.name,
              children: data.filter((r) => r.parent_id === p.id).map((c) => c.name),
            }))
        )
      })
      .finally(() => setTreeLoaded(true))
  }, [])

  const categoryOptions = [
    ...new Set([...catTree.map((c) => c.name), ...existingCategories]),
  ]
  const subOptions = catTree.find((c) => c.name === category)?.children || []

  useEffect(() => {
    if (postCatsLoaded && treeLoaded && categoryOptions.length === 0) setAddingNewCategory(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postCatsLoaded, treeLoaded, categoryOptions.length])

  useEffect(() => {
    supabase
      .from('posts')
      .select('author')
      .then(({ data }) => {
        if (!data) return
        const list = [...new Set(data.map((r) => (r.author || '').trim()).filter(Boolean))]
        setExistingAuthors(list)
        if (list.length === 0) setAddingNewAuthor(true)
      })
  }, [])

  useEffect(() => {
    document.title = isEditing ? 'Edit post — Admin' : 'New post — Admin'
    if (!isEditing) return
    supabase
      .from('posts')
      .select('*')
      .eq('id', id)
      .single()
      .then(({ data, error: err }) => {
        if (err || !data) {
          setError('Could not load this post.')
          setLoading(false)
          return
        }
        setTitle(data.title)
        setSlug(data.slug)
        setExcerpt(data.excerpt || '')
        {
          const kw = splitKeywords(data.keywords || [])
          setPrimaryKw(kw.primary)
          setSecondaryKw(kw.secondary)
        }
        setTldr(data.tldr || '')
        setCtaText(data.cta_text || '')
        setCtaLink(data.cta_link || '')
        setCoverImages(parseCovers(data.cover_image))
        setCategory(data.category || 'General')
        setSubcategory(data.subcategory || '')
        setAuthor(data.author || '')
        setPublished(data.published)
        setBlocks(data.content && data.content.length ? data.content : [newTextBlock('')])
        slugTouched.current = true
        setLoading(false)
      })
  }, [id, isEditing])

  function handleTitleChange(value) {
    setTitle(value)
    if (!slugTouched.current) {
      setSlug(slugify(value))
    }
  }

  function applyPastedBlog(raw) {
    const text = (raw || '').trim()
    if (!text) {
      setPasteMsg('Nothing to paste. Copy the blog first, then paste it here.')
      return
    }
    const hasContent =
      title.trim() || blocks.some((b) => b.type !== 'text' || (b.content || '').trim())
    if (hasContent && !window.confirm('This will replace the current title and content. Continue?')) {
      return
    }
    const parsed = parseMarkdownBlog(text)
    if (!parsed.title && parsed.blocks.length === 0) {
      setPasteMsg('Could not find any blog content in the pasted text.')
      return
    }
    if (parsed.title) {
      setTitle(parsed.title)
      if (!slugTouched.current) setSlug(slugify(parsed.title))
    }
    if (parsed.tldr) setTldr(parsed.tldr)
    if (parsed.ctaText) setCtaText(parsed.ctaText)
    if (parsed.excerpt && !excerpt.trim()) setExcerpt(parsed.excerpt)
    setBlocks(parsed.blocks.length ? parsed.blocks : [newTextBlock('')])
    setPasteText('')
    setPasteMsg(`Done. ${parsed.blocks.length} blocks filled in below. Review, pick a blog owner, then save as draft or publish.`)
    setMode('custom')
  }

  async function handlePasteFromClipboard() {
    try {
      const text = await navigator.clipboard.readText()
      applyPastedBlog(text)
    } catch {
      setPasteMsg('Browser blocked clipboard access. Paste into the box below instead (Ctrl+V).')
    }
  }

  async function handleCopyPost() {
    const md = postToMarkdown({ title, tldr, blocks, ctaText })
    try {
      await navigator.clipboard.writeText(md)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = md
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Uploads one or more cover images and adds them to the end of the list.
  // Two or more images are shown as a carousel on the post page. Capped at
  // MAX_COVERS so the carousel stays quick to click through.
  async function handleCoverUpload(fileList) {
    const room = MAX_COVERS - coverImages.length
    const files = Array.from(fileList || []).slice(0, Math.max(0, room))
    if (Array.from(fileList || []).length > files.length) {
      alert(`Only ${MAX_COVERS} cover images are allowed. Uploading the first ${files.length}.`)
    }
    if (files.length === 0) return
    setCoverBusy(true)
    const added = []
    for (const file of files) {
      const { path, error: badFile } = imagePath(file, 'covers/')
      if (badFile) {
        alert('Cover upload failed: ' + badFile)
        continue
      }
      const { error: uploadErr } = await supabase.storage
        .from('blog-images')
        .upload(path, file, { contentType: file.type })
      if (uploadErr) {
        alert('Cover upload failed: ' + uploadErr.message)
        continue
      }
      const { data } = supabase.storage.from('blog-images').getPublicUrl(path)
      added.push(data.publicUrl)
    }
    if (added.length) setCoverImages((prev) => [...prev, ...added])
    setCoverBusy(false)
  }

  function removeCover(index) {
    setCoverImages((prev) => prev.filter((_, i) => i !== index))
  }

  // Drag-and-drop reordering of the cover thumbnails.
  const [coverDrag, setCoverDrag] = useState(null)
  const [coverOver, setCoverOver] = useState(null)

  function handleCoverDrop(index) {
    if (coverDrag === null || coverDrag === index) {
      setCoverDrag(null)
      setCoverOver(null)
      return
    }
    setCoverImages((prev) => {
      const next = [...prev]
      const [moved] = next.splice(coverDrag, 1)
      next.splice(index, 0, moved)
      return next
    })
    setCoverDrag(null)
    setCoverOver(null)
  }

  // Make sure the category / subcategory exists in the categories table so it
  // shows up in the navbar dropdown. Failures here never block saving the post.
  async function ensureCategory() {
    try {
      const cat = category.trim()
      if (!cat) return
      let { data: parent } = await supabase
        .from('categories')
        .select('id')
        .eq('name', cat)
        .is('parent_id', null)
        .maybeSingle()
      if (!parent) {
        const res = await supabase.from('categories').insert({ name: cat }).select('id').single()
        parent = res.data
      }
      const sub = subcategory.trim()
      if (sub && parent) {
        const { data: existing } = await supabase
          .from('categories')
          .select('id')
          .eq('name', sub)
          .eq('parent_id', parent.id)
          .maybeSingle()
        if (!existing) await supabase.from('categories').insert({ name: sub, parent_id: parent.id })
      }
    } catch {
      /* ignore */
    }
  }

  async function savePost(publishValue) {
    if (!title.trim() || !slug.trim()) {
      setError('Title and slug are required.')
      return
    }
    if (!author.trim()) {
      setError('Pick or type a blog owner.')
      return
    }
    if (!category.trim()) {
      setError('Pick or type a category.')
      return
    }
    setSaving(true)
    setError('')

    const payload = {
      title: title.trim(),
      slug: slug.trim(),
      excerpt: excerpt.trim(),
      keywords: joinKeywords(primaryKw, secondaryKw),
      tldr: tldr.trim() || null,
      cta_text: ctaText.trim() || null,
      cta_link: ctaLink.trim() || null,
      cover_image: serializeCovers(coverImages),
      category: category.trim(),
      subcategory: subcategory.trim() || null,
      author: author.trim(),
      content: blocks,
      published: publishValue,
      updated_at: new Date().toISOString(),
    }

    let saveError
    if (isEditing) {
      const { error: err } = await supabase.from('posts').update(payload).eq('id', id)
      saveError = err
    } else {
      const { error: err } = await supabase.from('posts').insert(payload)
      saveError = err
    }

    setSaving(false)

    if (saveError) {
      setError(saveError.message.includes('duplicate') ? 'That slug is already in use.' : saveError.message)
      return
    }

    await ensureCategory()
    navigate('/admin')
  }

  if (loading) {
    return <div className="container" style={{ paddingTop: 48 }}>Loading...</div>
  }

  return (
    <div className="container" style={{ paddingTop: 48, paddingBottom: 90 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          flexWrap: 'wrap',
          marginBottom: 20,
        }}
      >
        <h1 style={{ fontSize: 28, margin: 0 }}>{isEditing ? 'Edit post' : 'New post'}</h1>

        <div className="mode-switch" style={{ marginBottom: 0 }}>
          {[
            { key: 'paste', title: 'Paste your blog', desc: 'Paste a full blog and it fills every section for you.' },
            { key: 'custom', title: 'Custom blog', desc: 'Write it yourself, block by block.' },
          ].map((opt) => (
            <button
              key={opt.key}
              type="button"
              title={opt.desc}
              onClick={() => setMode(opt.key)}
              className={`mode-btn${mode === opt.key ? ' is-on' : ''}`}
            >
              {opt.title}
            </button>
          ))}
        </div>
      </div>

      {mode === null && (
        <p style={{ color: 'var(--color-ink-soft)', fontSize: 14 }}>
          Choose how you want to add this post.
        </p>
      )}

      {mode === 'paste' && (
        <div
          style={{
            border: '1px dashed var(--color-line)',
            borderRadius: 'var(--radius-md)',
            padding: 18,
            marginBottom: 30,
            background: 'var(--color-surface)',
          }}
        >
          <label style={{ display: 'block', fontWeight: 600, marginBottom: 6 }}>
            Quick paste: full blog
          </label>
          <p style={{ fontSize: 13, color: 'var(--color-ink-soft)', marginBottom: 10 }}>
            Paste the whole blog (Markdown) here. Title, TL;DR, headings, paragraphs, tables, FAQs
            and images go into their own sections automatically.
          </p>
          <textarea
            rows={5}
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
            onPaste={(e) => {
              const text = e.clipboardData.getData('text')
              if (text) {
                e.preventDefault()
                applyPastedBlog(text)
              }
            }}
            placeholder="Ctrl+V here and the blog fills in automatically..."
          />
          <div style={{ display: 'flex', gap: 10, marginTop: 10, flexWrap: 'wrap' }}>
            <button type="button" className="btn" style={{ fontSize: 13 }} onClick={handlePasteFromClipboard}>
              Paste from clipboard
            </button>
            <button
              type="button"
              className="btn btn-outline"
              style={{ fontSize: 13 }}
              onClick={() => applyPastedBlog(pasteText)}
            >
              Fill from text box
            </button>
          </div>
          {pasteMsg && (
            <p style={{ fontSize: 13, marginTop: 10, color: 'var(--color-ink-soft)' }}>{pasteMsg}</p>
          )}
        </div>
      )}

      {mode === 'custom' && (
      <form onSubmit={(e) => { e.preventDefault(); savePost(published) }}>
        {pasteMsg && (
          <p style={{ fontSize: 13, marginBottom: 18, color: 'var(--color-ink-soft)' }}>{pasteMsg}</p>
        )}

        <div className="editor-actionbar">
          <span>
            Status: <strong>{published ? 'Live' : 'Draft'}</strong>{' '}
            <span style={{ color: 'var(--color-ink-soft)' }}>
              {published ? '(visible to everyone)' : '(only you can see this)'}
            </span>
          </span>

          {/* Everything you can do with the post sits on this one line. */}
          <span className="actions">
            {isEditing && slug && (
              <a
                href={`/blog/${slug}`}
                target="_blank"
                rel="noreferrer"
                className="btn btn-outline"
              >
                View
              </a>
            )}
            <button type="button" className="btn btn-outline" onClick={handleCopyPost}>
              {copied ? 'Copied!' : 'Copy'}
            </button>
            {!published ? (
              <>
                <button
                  type="button"
                  className="btn btn-outline"
                  disabled={saving}
                  onClick={() => savePost(false)}
                >
                  {saving ? 'Saving...' : 'Save draft'}
                </button>
                <button type="button" className="btn" disabled={saving} onClick={() => savePost(true)}>
                  Publish
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  className="btn btn-outline"
                  disabled={saving}
                  onClick={() => savePost(false)}
                >
                  Unpublish
                </button>
                <button type="button" className="btn" disabled={saving} onClick={() => savePost(true)}>
                  {saving ? 'Saving...' : 'Update'}
                </button>
              </>
            )}
            <button type="button" className="btn btn-outline" onClick={() => navigate('/admin')}>
              Cancel
            </button>
          </span>
        </div>

        {error && (
          <p style={{ color: 'var(--color-danger)', fontSize: 14, marginBottom: 14 }}>{error}</p>
        )}

        {/* Title stands on its own, bigger, since it's what you look at
            first. Everything else below it sits in a neat 2x2 grid. */}
        <div className="field field-title">
          <label htmlFor="title">Title</label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            required
          />
        </div>

        <div className="field-grid field-compact">
          <div className="field">
            <label htmlFor="slug">URL slug</label>
            <input
              id="slug"
              type="text"
              value={slug}
              onChange={(e) => {
                slugTouched.current = true
                setSlug(slugify(e.target.value))
              }}
              required
            />
          </div>

          <div className="field">
            <label htmlFor="author">Blog owner</label>
            <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                {!addingNewAuthor ? (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <Dropdown
                      id="author"
                      value={author}
                      placeholder="Blog owner"
                      style={{ flex: 1 }}
                      options={existingAuthors.map((name) => ({ value: name, label: name }))}
                      emptyText="No owners yet — use + New"
                      onChange={setAuthor}
                    />
                    <button
                      type="button"
                      className="btn btn-outline"
                      style={{ whiteSpace: 'nowrap' }}
                      title="Add a new blog owner"
                      onClick={() => {
                        setAddingNewAuthor(true)
                        setAuthor('')
                      }}
                    >
                      + New
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      type="text"
                      placeholder="Blog owner"
                      value={author}
                      onChange={(e) => setAuthor(e.target.value)}
                    />
                    {existingAuthors.length > 0 && (
                      <button
                        type="button"
                        className="btn btn-outline"
                        style={{ whiteSpace: 'nowrap' }}
                        onClick={() => setAddingNewAuthor(false)}
                      >
                        Existing
                      </button>
                    )}
                  </div>
                )}
              </div>

              <AuthorAvatarPicker name={author} />
            </div>
          </div>

          <div className="field">
            <label htmlFor="category">Category</label>
            {!addingNewCategory ? (
              <div style={{ display: 'flex', gap: 8 }}>
                <Dropdown
                  id="category"
                  value={category}
                  placeholder="Select a category"
                  style={{ flex: 1 }}
                  options={categoryOptions.map((cat) => ({ value: cat, label: cat }))}
                  emptyText="No categories yet — use + New"
                  onChange={(v) => {
                    setCategory(v)
                    setSubcategory('')
                    setAddingNewSub(false)
                  }}
                />
                <button
                  type="button"
                  className="btn btn-outline"
                  style={{ whiteSpace: 'nowrap' }}
                  title="Add a new category"
                  onClick={() => {
                    setAddingNewCategory(true)
                    setCategory('')
                  }}
                >
                  + New
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="text"
                  autoFocus
                  placeholder="e.g. Travel"
                  value={category}
                  onChange={(e) => {
                    setCategory(e.target.value)
                    setSubcategory('')
                  }}
                />
                <button
                  type="button"
                  className="btn btn-outline"
                  style={{ whiteSpace: 'nowrap' }}
                  onClick={() => setAddingNewCategory(false)}
                >
                  Existing
                </button>
              </div>
            )}

            {category.trim() && (
              <div style={{ marginTop: 14 }}>
                <label htmlFor="subcategory">Subcategory (optional)</label>
                {!addingNewSub && subOptions.length > 0 ? (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <Dropdown
                      id="subcategory"
                      value={subcategory}
                      placeholder="None"
                      style={{ flex: 1 }}
                      options={[
                        { value: '', label: 'None' },
                        ...[...new Set([...subOptions, ...(subcategory ? [subcategory] : [])])].map(
                          (sub) => ({ value: sub, label: sub })
                        ),
                      ]}
                      onChange={setSubcategory}
                    />
                    <button
                      type="button"
                      className="btn btn-outline"
                      style={{ whiteSpace: 'nowrap' }}
                      title="Add a new subcategory"
                      onClick={() => {
                        setAddingNewSub(true)
                        setSubcategory('')
                      }}
                    >
                      + New
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      type="text"
                      placeholder="Leave empty for none"
                      value={subcategory}
                      onChange={(e) => setSubcategory(e.target.value)}
                    />
                    {subOptions.length > 0 && (
                      <button
                        type="button"
                        className="btn btn-outline"
                        style={{ whiteSpace: 'nowrap' }}
                        onClick={() => {
                          setAddingNewSub(false)
                          setSubcategory('')
                        }}
                      >
                        Existing
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="field kw-admin">
            <label htmlFor="keywords">Keywords</label>
            <div className="kw-admin-box">
              <div className="kw-admin-row">
                <div className="kw-admin-name">Primary</div>
                <KeywordsInput
                  value={primaryKw}
                  onChange={setPrimaryKw}
                 
                />
              </div>
              <div className="kw-admin-row">
                <div className="kw-admin-name">Secondary</div>
                <KeywordsInput
                  value={secondaryKw}
                  onChange={setSecondaryKw}
                
                />
              </div>
  
            </div>
          </div>
        </div>

        <div className="field-grid field-compact">
          <div className="field field-wide cover-excerpt-row">
            <div className="field">
              <label>
                Cover images (optional)
                {coverImages.length > 1 && (
                  <span style={{ color: 'var(--color-accent)' }}>
                    {' '}&middot; shown as a carousel &middot; drag to reorder
                  </span>
                )}
              </label>
              <div className="cover-thumbs">
                {coverImages.map((url, i) => (
                  <div
                    className={`cover-thumb${coverDrag === i ? ' is-dragging' : ''}${coverOver === i && coverDrag !== null && coverDrag !== i ? ' is-drop-target' : ''}`}
                    key={`${url}-${i}`}
                    draggable
                    title="Drag to reorder"
                    onDragStart={() => setCoverDrag(i)}
                    onDragOver={(e) => {
                      e.preventDefault()
                      if (coverOver !== i) setCoverOver(i)
                    }}
                    onDrop={(e) => {
                      e.preventDefault()
                      handleCoverDrop(i)
                    }}
                    onDragEnd={() => {
                      setCoverDrag(null)
                      setCoverOver(null)
                    }}
                  >
                    <img src={url} alt="" draggable={false} />
                    <span className="cover-thumb-n">{i + 1}</span>
                    <button
                      type="button"
                      className="cover-thumb-x"
                      title="Remove this image"
                      onClick={() => removeCover(i)}
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
                    {coverBusy
                      ? 'Uploading...'
                      : coverImages.length
                        ? '+ Add more images'
                        : 'Upload images'}
                  </button>
                ) : (
                  <span style={{ fontSize: 12, color: 'var(--color-ink-soft)' }}>
                    Maximum {MAX_COVERS} images
                  </span>
                )}
              </div>
             
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

            <div className="field">
              <label htmlFor="excerpt">Short excerpt (shown in blog listing)</label>
              <textarea
                id="excerpt"
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="field" style={{ marginTop: 26 }}>
          <label>Post content</label>
          <BlockEditor
            blocks={blocks}
            onChange={setBlocks}
            tldr={tldr}
            onTldrChange={setTldr}
          />
        </div>

        <div className="field-grid field-compact">
          <div className="field">
            <label htmlFor="ctaText">Call to action text (button at the end, optional)</label>
            <input
              id="ctaText"
              type="text"
              value={ctaText}
              onChange={(e) => setCtaText(e.target.value)}
              placeholder="e.g. Get in touch"
            />
          </div>

          <div className="field">
            <label htmlFor="ctaLink">Call to action link</label>
            <input
              id="ctaLink"
              type="text"
              value={ctaLink}
              onChange={(e) => setCtaLink(e.target.value)}
              placeholder="e.g. /contact or https://..."
            />
          </div>
        </div>
      </form>
      )}
    </div>
  )
}