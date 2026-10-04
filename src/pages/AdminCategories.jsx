import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'

export default function AdminCategories() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [newCategory, setNewCategory] = useState('')
  const [subDrafts, setSubDrafts] = useState({})
  const [error, setError] = useState('')

  async function load() {
    const { data, error: err } = await supabase
      .from('categories')
      .select('id, name, parent_id, sort_order')
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true })
    if (err) {
      setError(
        'Could not load categories. Run supabase/migration-categories.sql in the Supabase SQL Editor first.'
      )
    } else {
      setError('')
      setRows(data || [])
    }
    setLoading(false)
  }

  useEffect(() => {
    document.title = 'Categories — Admin'
    load()
  }, [])

  async function addCategory(e) {
    e.preventDefault()
    const name = newCategory.trim()
    if (!name) return
    const { error: err } = await supabase.from('categories').insert({ name })
    if (err) {
      setError(err.message.includes('duplicate') ? 'That category already exists.' : err.message)
      return
    }
    setNewCategory('')
    load()
  }

  async function addSub(parent) {
    const name = (subDrafts[parent.id] || '').trim()
    if (!name) return
    const { error: err } = await supabase
      .from('categories')
      .insert({ name, parent_id: parent.id })
    if (err) {
      setError(err.message.includes('duplicate') ? 'That subcategory already exists.' : err.message)
      return
    }
    setSubDrafts((d) => ({ ...d, [parent.id]: '' }))
    load()
  }

  async function remove(row, isParent) {
    const msg = isParent
      ? `Delete "${row.name}" and all its subcategories from the menu? Posts are not deleted.`
      : `Delete subcategory "${row.name}" from the menu? Posts are not deleted.`
    if (!confirm(msg)) return
    await supabase.from('categories').delete().eq('id', row.id)
    load()
  }

  const parents = rows.filter((r) => !r.parent_id)

  return (
    <div className="measure" style={{ paddingTop: 60, paddingBottom: 90 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 30,
        }}
      >
        <h1 style={{ fontSize: 28, margin: 0 }}>Categories</h1>
        <Link to="/admin" className="btn btn-outline" style={{ fontSize: 13 }}>
          Back to posts
        </Link>
      </div>

      <p style={{ fontSize: 14, color: 'var(--color-ink-soft)', marginBottom: 24 }}>
        These show up in the Blog dropdown in the navbar. Add a category, then add subcategories
        under it.
      </p>

      <form onSubmit={addCategory} style={{ display: 'flex', gap: 10, marginBottom: 34 }}>
        <input
          type="text"
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value)}
          placeholder="New category name"
        />
        <button type="submit" className="btn" style={{ whiteSpace: 'nowrap' }}>
          + Add category
        </button>
      </form>

      {error && <p style={{ color: 'var(--color-danger)', fontSize: 14 }}>{error}</p>}
      {loading && <p style={{ color: 'var(--color-ink-soft)' }}>Loading...</p>}
      {!loading && !error && parents.length === 0 && (
        <p style={{ color: 'var(--color-ink-soft)' }}>No categories yet.</p>
      )}

      {parents.map((parent) => {
        const children = rows.filter((r) => r.parent_id === parent.id)
        return (
          <div
            key={parent.id}
            style={{
              border: '1px solid var(--color-line)',
              borderRadius: 4,
              padding: 16,
              marginBottom: 16,
              background: 'var(--color-surface)',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 10,
              }}
            >
              <strong style={{ fontSize: 17 }}>{parent.name}</strong>
              <button
                type="button"
                className="btn btn-danger"
                style={{ padding: '4px 10px', fontSize: 12 }}
                onClick={() => remove(parent, true)}
              >
                Delete
              </button>
            </div>

            {children.map((child) => (
              <div
                key={child.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '6px 0 6px 16px',
                  borderTop: '1px solid var(--color-line)',
                  fontSize: 15,
                }}
              >
                <span>{child.name}</span>
                <button
                  type="button"
                  className="btn btn-danger"
                  style={{ padding: '3px 9px', fontSize: 11 }}
                  onClick={() => remove(child, false)}
                >
                  Delete
                </button>
              </div>
            ))}

            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <input
                type="text"
                value={subDrafts[parent.id] || ''}
                onChange={(e) => setSubDrafts((d) => ({ ...d, [parent.id]: e.target.value }))}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addSub(parent)
                  }
                }}
                placeholder={`New subcategory under ${parent.name}`}
              />
              <button
                type="button"
                className="btn btn-outline"
                style={{ whiteSpace: 'nowrap', fontSize: 13 }}
                onClick={() => addSub(parent)}
              >
                + Add
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}