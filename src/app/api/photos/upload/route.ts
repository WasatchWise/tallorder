import { NextResponse } from 'next/server'
import sharp from 'sharp'
import { randomUUID } from 'crypto'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

const BUCKET = 'tall-order-photos'
const MAX_BYTES = 10 * 1024 * 1024

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  const isPrimary = formData.get('is_primary') === 'true'

  if (!file || file.size === 0) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'File too large (max 10 MB)' }, { status: 413 })
  }

  const id = randomUUID()
  const rawPath = `${user.id}/${id}.jpg`
  const blurredPath = `blurred/${user.id}/${id}.jpg`
  const admin = createAdminClient()

  let rawBuffer: Buffer
  let blurredBuffer: Buffer

  try {
    const input = Buffer.from(await file.arrayBuffer())
    rawBuffer = await sharp(input)
      .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 88 })
      .toBuffer()
    blurredBuffer = await sharp(input)
      .resize(400, 533, { fit: 'cover' })
      .blur(20)
      .jpeg({ quality: 75 })
      .toBuffer()
  } catch {
    return NextResponse.json({ error: 'Could not process image' }, { status: 422 })
  }

  const { error: rawErr } = await admin.storage
    .from(BUCKET)
    .upload(rawPath, rawBuffer, { contentType: 'image/jpeg', upsert: false })
  if (rawErr) return NextResponse.json({ error: rawErr.message }, { status: 500 })

  const { error: blurErr } = await admin.storage
    .from(BUCKET)
    .upload(blurredPath, blurredBuffer, { contentType: 'image/jpeg', upsert: false })
  if (blurErr) {
    await admin.storage.from(BUCKET).remove([rawPath])
    return NextResponse.json({ error: blurErr.message }, { status: 500 })
  }

  const { data: photo, error: dbErr } = await admin
    .from('photos')
    .insert({
      user_id: user.id,
      storage_path: rawPath,
      blurred_path: blurredPath,
      blur_level_default: 3,
      is_primary: isPrimary,
      approved: false,
    })
    .select('id, storage_path, blurred_path, is_primary, approved, blur_level_default')
    .single()

  if (dbErr) {
    await admin.storage.from(BUCKET).remove([rawPath, blurredPath])
    return NextResponse.json({ error: dbErr.message }, { status: 500 })
  }

  return NextResponse.json(photo)
}
