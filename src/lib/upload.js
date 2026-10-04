// Upload safety: only known-safe file types, a size limit, and a random file
// name whose extension comes from the real file TYPE (never from what the
// user typed). The storage bucket enforces the same rules on the server, so
// even if this file were edited in the browser the upload would be refused.

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024 // 10 MB

const IMAGE_TYPES = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/avif': 'avif',
}

const DOWNLOAD_TYPES = {
  'application/pdf': 'pdf',
  'application/zip': 'zip',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
  'text/csv': 'csv',
  'text/plain': 'txt',
}

function randomName() {
  const bytes = new Uint8Array(12)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
}

function check(file, allowed, label) {
  if (!file) return { error: 'No file selected.' }
  if (file.size > MAX_UPLOAD_BYTES) return { error: `${file.name} is larger than 10 MB.` }
  const ext = allowed[file.type]
  if (!ext) return { error: `${file.name}: this file type is not allowed (${label}).` }
  return { ext }
}

/** @returns {{ path?: string, error?: string }} */
export function imagePath(file, folder = '') {
  const r = check(file, IMAGE_TYPES, 'JPG, PNG, WEBP, GIF or AVIF images only')
  if (r.error) return r
  return { path: `${folder}${randomName()}.${r.ext}` }
}

/** @returns {{ path?: string, error?: string }} */
export function downloadPath(file, folder = 'files/') {
  const r = check(file, DOWNLOAD_TYPES, 'PDF, ZIP, Word, Excel, PowerPoint, CSV or TXT only')
  if (r.error) return r
  return { path: `${folder}${randomName()}.${r.ext}` }
}