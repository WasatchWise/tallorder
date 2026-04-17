import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

const BUCKET = 'tall-order-photos'

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()

  const { data: photo } = await admin
    .from('photos')
    .select('id, user_id, storage_path, blurred_path, is_primary')
    .eq('id', id)
    .maybeSingle()

  if (!photo) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (photo.user_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const paths: string[] = [photo.storage_path]
  if (photo.blurred_path) paths.push(photo.blurred_path)
  await admin.storage.from(BUCKET).remove(paths)
  await admin.from('photos').delete().eq('id', id)

  return NextResponse.json({ deleted: true })
}
