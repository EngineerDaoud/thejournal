import { supabase } from './supabaseClient'

// Asks your own Supabase Edge Function ("notify-comment") to email a new comment
// to your Gmail. No third-party mail service is involved: the function runs on
// your Supabase project and talks to Gmail SMTP with your own app password.
//
// Setup instructions are at the top of supabase/functions/notify-comment/index.ts
//
// The password lives in a Supabase secret, never in this file and never in the
// browser, which is exactly why the sending happens over there and not here.

/**
 * Emails one new comment to you.
 * Never throws: the comment is already safely stored, so a mail problem must not
 * turn into an error message for the reader.
 * @returns {Promise<boolean>} true if the mail went out
 */
export async function sendCommentEmail({ name, email, body, postTitle, postUrl }) {
  try {
    const { data, error } = await supabase.functions.invoke('notify-comment', {
      body: { name, email, body, postTitle, postUrl },
    })

    if (error) {
      // Not deployed yet, or SMTP secrets missing — you will still see the
      // comment waiting in /admin/comments.
      console.warn('Comment email not sent:', error.message)
      return false
    }

    return Boolean(data?.ok)
  } catch (err) {
    console.warn('Comment email not sent:', err?.message || err)
    return false
  }
}