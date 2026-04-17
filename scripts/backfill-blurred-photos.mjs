/**
 * Backfill blurred_path for photos uploaded before the blurred_path migration.
 * Reads each photo from storage, generates a blurred variant via sharp,
 * uploads to blurred/{userId}/{id}.jpg, and updates the photos row.
 *
 * Usage:
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/backfill-blurred-photos.mjs
 *
 * Safe to re-run: skips photos that already have blurred_path set.
 */

import { createClient } from '@supabase/supabase-js'
import sharp from 'sharp'

const SUPABASE_URL = process.env.SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const BUCKET = 'tall-order-photos'

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

const { data: photos, error } = await supabase
  .from('photos')
  .select('id, user_id, storage_path, blurred_path')
  .is('blurred_path', null)

if (error) {
  console.error('Failed to fetch photos:', error.message)
  process.exit(1)
}

console.log(`Found ${photos.length} photos without blurred_path`)

let ok = 0, failed = 0

for (const photo of photos) {
  try {
    const { data: fileData, error: downloadErr } = await supabase.storage
      .from(BUCKET)
      .download(photo.storage_path)

    if (downloadErr || !fileData) {
      console.warn(`  SKIP ${photo.id}: download failed — ${downloadErr?.message}`)
      failed++
      continue
    }

    const input = Buffer.from(await fileData.arrayBuffer())
    const blurredBuffer = await sharp(input)
      .resize(400, 533, { fit: 'cover' })
      .blur(20)
      .jpeg({ quality: 75 })
      .toBuffer()

    const blurredPath = `blurred/${photo.user_id}/${photo.id}.jpg`

    const { error: uploadErr } = await supabase.storage
      .from(BUCKET)
      .upload(blurredPath, blurredBuffer, { contentType: 'image/jpeg', upsert: true })

    if (uploadErr) {
      console.warn(`  SKIP ${photo.id}: upload failed — ${uploadErr.message}`)
      failed++
      continue
    }

    const { error: updateErr } = await supabase
      .from('photos')
      .update({ blurred_path: blurredPath })
      .eq('id', photo.id)

    if (updateErr) {
      console.warn(`  SKIP ${photo.id}: DB update failed — ${updateErr.message}`)
      failed++
      continue
    }

    console.log(`  OK  ${photo.id} → ${blurredPath}`)
    ok++
  } catch (err) {
    console.warn(`  SKIP ${photo.id}: unexpected error — ${err.message}`)
    failed++
  }
}

console.log(`\nDone: ${ok} backfilled, ${failed} failed`)
