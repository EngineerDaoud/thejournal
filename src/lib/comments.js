import { supabase } from './supabaseClient'
import { sendCommentEmail } from './mailer'

// Comments the public is allowed to see: the ones you approved.
export async function fetchApprovedComments(postId) {
  if (!postId) return []
  const { data, error } = await supabase
    .from('comments')
    .select('id, name, body, created_at')
    .eq('post_id', postId)
    .eq('approved', true)
    .order('created_at', { ascending: false })

  if (error) {
    // Table not created yet (migration-comments.sql not run) — stay quiet.
    console.warn('comments not loaded:', error.message)
    return []
  }
  return data || []
}

/**
 * Saves a new comment (as pending) and emails you about it.
 * @returns {{ ok: boolean, emailed?: boolean, error?: string }}
 */
export async function submitComment({ post, name, email, body }) {
  const clean = {
    post_id: post.id,
    post_slug: post.slug,
    post_title: post.title,
    name: name.trim().slice(0, 80),
    email: email.trim().slice(0, 160),
    body: body.trim().slice(0, 3000),
    approved: false,
  }

  const { error } = await supabase.from('comments').insert(clean)
  if (error) {
    console.error(error)
    // The database rate limiter has its own friendly message; show only that one.
    if (/too many comments|duplicate comment/i.test(error.message || '')) {
      return { ok: false, error: error.message }
    }
    return { ok: false, error: 'Your comment could not be saved. Please try again.' }
  }

  const emailed = await sendCommentEmail({
    name: clean.name,
    email: clean.email,
    body: clean.body,
    postTitle: clean.post_title,
    postUrl: `${window.location.origin}/blog/${clean.post_slug}`,
  })

  return { ok: true, emailed }
}

/* ---------------- admin only (protected by Supabase RLS) ---------------- */

// The email column is hidden from the public API, so the admin list comes from a
// server function that first checks "is this the admin?" (see security-hardening.sql).
export async function fetchAllComments() {
  const { data, error } = await supabase.rpc('admin_list_comments')

  if (error) {
    console.error(error)
    return []
  }
  return data || []
}

export async function setCommentApproved(id, value) {
  const { error } = await supabase.from('comments').update({ approved: value }).eq('id', id)
  if (error) console.error(error)
  return !error
}

export async function deleteComment(id) {
  const { error } = await supabase.from('comments').delete().eq('id', id)
  if (error) console.error(error)
  return !error
}

export async function countPendingComments() {
  const { count, error } = await supabase
    .from('comments')
    .select('id', { count: 'exact', head: true })
    .eq('approved', false)

  if (error) return 0
  return count || 0
}