import { ADMIN_EMAIL } from './supabaseClient'

// Edit the text here once and it updates everywhere (About, Footer, Author pages...).
export const SITE = {
  name: 'The Journal',
  tagline: 'Daily technology, environment & education updates',
  description:
    'Clear, carefully written updates on technology, the environment, education and the trending topics everyone is talking about.',
  email: ADMIN_EMAIL,
}

// Shown as "Last updated" on the Privacy Policy, Terms and Disclaimer pages.
// Change this date whenever you edit those pages.
export const POLICY_UPDATED = 'September 20, 2026'

// Short author bios shown in the author box under each post and on the author page.
// Add one line per author, spelled exactly like the "Author" field in the post editor.
// Authors not listed here get a simple default line.
export const AUTHOR_BIOS = {
  // 'David': 'David writes about technology, AI and how people use it in daily life.',
  // 'khan ali': 'Khan Ali writes about the environment, education and trending stories.',
}

export function authorBio(name) {
  return AUTHOR_BIOS[name] || `${name} is a writer at ${SITE.name}.`
}

export function authorInitial(name) {
  return (name || '?').trim().charAt(0).toUpperCase()
}