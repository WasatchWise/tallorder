'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Upload, X, Star, Clock, Check, Loader2 } from 'lucide-react'

interface Photo {
  id: string
  storage_path: string
  blurred_path?: string
  is_primary: boolean
  approved: boolean
  blur_level_default: number
}

export default function PhotoManager({ userId, initialPhotos }: { userId: string; initialPhotos: Photo[] }) {
  const supabase = createClient()
  const fileRef = useRef<HTMLInputElement>(null)
  const [photos, setPhotos] = useState<Photo[]>(initialPhotos)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return
    const remaining = 6 - photos.length
    const toUpload = files.slice(0, remaining)
    if (!toUpload.length) return

    setUploading(true)
    setError(null)

    for (const file of toUpload) {
      if (file.size > 10 * 1024 * 1024) {
        setError(`${file.name} is over 10MB. Skipped.`)
        continue
      }

      const fd = new FormData()
      fd.append('file', file)
      fd.append('is_primary', String(photos.length === 0))

      const res = await fetch('/api/photos/upload', { method: 'POST', body: fd })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        setError((body as { error?: string }).error ?? 'Upload failed. Try again.')
        continue
      }

      const newPhoto: Photo = await res.json()
      setPhotos(prev => [...prev, newPhoto])
    }

    setUploading(false)
    if (fileRef.current) fileRef.current.value = ''
  }

  async function removePhoto(photo: Photo) {
    // If removing primary, promote next photo
    if (photo.is_primary && photos.length > 1) {
      const next = photos.find(p => p.id !== photo.id)
      if (next) await setPrimary(next, false) // silent
    }

    await fetch(`/api/photos/${photo.id}`, { method: 'DELETE' })
    setPhotos(prev => prev.filter(p => p.id !== photo.id))
  }

  async function setPrimary(photo: Photo, updateState = true) {
    await supabase.from('photos').update({ is_primary: false }).eq('user_id', userId)
    await supabase.from('photos').update({ is_primary: true }).eq('id', photo.id)
    if (updateState) {
      setPhotos(prev => prev.map(p => ({ ...p, is_primary: p.id === photo.id })))
    }
  }

  return (
    <div className="bg-white border border-[#E7E5E4] rounded-xl p-5">
      <p className="text-xs font-medium text-[#78716C] uppercase tracking-wider mb-3">Photos</p>
      <p className="text-xs text-[#A8A29E] mb-4">Up to 6 photos. All photos are reviewed before going live.</p>

      <div className="grid grid-cols-3 gap-3 mb-4">
        {photos.map(photo => (
          <div key={photo.id} className="aspect-square rounded-xl overflow-hidden relative bg-stone-200">
            {/* Blurred placeholder */}
            <div className="absolute inset-0 bg-gradient-to-br from-stone-300 to-stone-400" style={{ filter: 'blur(8px)', transform: 'scale(1.1)' }} />

            {/* Badges */}
            <div className="absolute top-1.5 left-1.5 flex flex-col gap-1">
              {photo.is_primary && (
                <span className="text-[10px] bg-[#D97706] text-white px-1.5 py-0.5 rounded font-semibold">Primary</span>
              )}
              {photo.approved ? (
                <span className="text-[10px] bg-[#16A34A] text-white px-1.5 py-0.5 rounded flex items-center gap-0.5">
                  <Check className="w-2.5 h-2.5" /> Live
                </span>
              ) : (
                <span className="text-[10px] bg-[#78716C] text-white px-1.5 py-0.5 rounded flex items-center gap-0.5">
                  <Clock className="w-2.5 h-2.5" /> Review
                </span>
              )}
            </div>

            {/* Actions */}
            <div className="absolute bottom-1.5 right-1.5 flex gap-1">
              {!photo.is_primary && (
                <button
                  onClick={() => setPrimary(photo)}
                  title="Set as primary"
                  className="w-6 h-6 rounded-full bg-[#1C1917]/70 flex items-center justify-center hover:bg-[#D97706] transition-colors cursor-pointer"
                >
                  <Star className="w-3 h-3 text-white" />
                </button>
              )}
              <button
                onClick={() => removePhoto(photo)}
                title="Remove photo"
                className="w-6 h-6 rounded-full bg-[#1C1917]/70 flex items-center justify-center hover:bg-red-500 transition-colors cursor-pointer"
              >
                <X className="w-3 h-3 text-white" />
              </button>
            </div>
          </div>
        ))}

        {photos.length < 6 && (
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="aspect-square rounded-xl border-2 border-dashed border-[#D6D3D1] flex flex-col items-center justify-center gap-1.5 hover:border-[#D97706] transition-colors cursor-pointer disabled:opacity-50"
          >
            {uploading ? (
              <Loader2 className="w-5 h-5 text-[#78716C] animate-spin" />
            ) : (
              <>
                <Upload className="w-5 h-5 text-[#78716C]" />
                <span className="text-xs text-[#78716C]">Add photo</span>
              </>
            )}
          </button>
        )}
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic"
        multiple
        onChange={handleUpload}
        className="hidden"
      />

      {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
      <p className="text-xs text-[#A8A29E]">{photos.length}/6 photos. Tap <Star className="w-3 h-3 inline" /> to set primary.</p>
    </div>
  )
}
