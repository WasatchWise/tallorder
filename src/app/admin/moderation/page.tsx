'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { PhotoActions, ReportActions, VerifyActions } from './ModerationActions'
import { Loader2, Shield, Image, Flag, ShieldCheck } from 'lucide-react'

type Photo = {
  id: string
  storage_path: string
  is_primary: boolean
  created_at: string
  user_id: string
  profiles: { pseudonym: string } | null
  signedUrl?: string | null
}

type Report = {
  id: string
  category: string
  description: string | null
  created_at: string
  reporter_id: string
  reported_id: string
  reporter: { pseudonym: string } | null
  reported: { pseudonym: string } | null
}

type VerificationSubmission = {
  id: string
  user_id: string
  photo_path: string
  submitted_at: string
  profiles: { pseudonym: string; height_ft: number; height_in: number } | null
}

export default function ModerationPage() {
  const router = useRouter()
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [unauthorized, setUnauthorized] = useState(false)
  const [photos, setPhotos] = useState<Photo[]>([])
  const [reports, setReports] = useState<Report[]>([])
  const [verifications, setVerifications] = useState<VerificationSubmission[]>([])

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace('/login'); return }

      // Quick admin check via API
      const check = await fetch('/api/admin/moderate')
      if (check.status === 403) { setUnauthorized(true); setLoading(false); return }

      const [{ data: photoRows }, { data: reportRows }, { data: verifyRows }] = await Promise.all([
        supabase
          .from('photos')
          .select('id, storage_path, is_primary, created_at, user_id, profiles(pseudonym)')
          .eq('approved', false)
          .order('created_at', { ascending: true })
          .limit(50),
        supabase
          .from('reports')
          .select('id, category, description, created_at, reporter_id, reported_id, reporter:profiles!reports_reporter_id_fkey(pseudonym), reported:profiles!reports_reported_id_fkey(pseudonym)')
          .eq('status', 'pending')
          .order('created_at', { ascending: true })
          .limit(50),
        supabase
          .from('verification_submissions')
          .select('id, user_id, photo_path, submitted_at, profiles(pseudonym, height_ft, height_in)')
          .eq('status', 'pending')
          .order('submitted_at', { ascending: true })
          .limit(50),
      ])

      // Generate signed URLs for photos (15-min expiry)
      const photosWithUrls = await Promise.all(
        (photoRows ?? []).map(async (photo) => {
          const { data } = await supabase.storage.from('tall-order-photos').createSignedUrl(photo.storage_path, 900)
          return { ...photo, signedUrl: data?.signedUrl ?? null }
        })
      )
      setPhotos(photosWithUrls as unknown as Photo[])
      setReports((reportRows ?? []) as unknown as Report[])
      setVerifications((verifyRows ?? []) as unknown as VerificationSubmission[])
      setLoading(false)
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F5F4] flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-[#D97706] animate-spin" />
      </div>
    )
  }

  if (unauthorized) {
    return (
      <div className="min-h-screen bg-[#F5F5F4] flex items-center justify-center text-center px-4">
        <div>
          <p className="text-sm font-medium text-[#1C1917] mb-2">Not authorized</p>
          <Link href="/browse" className="text-sm text-[#D97706] hover:underline">Go home</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F5F5F4]">
      <div className="max-w-[720px] mx-auto px-4 py-8">
        <div className="flex items-center gap-2 mb-6">
          <Shield className="w-5 h-5 text-[#D97706]" />
          <h1 className="text-xl font-bold text-[#1C1917]">Moderation Queue</h1>
        </div>

        {/* Photo review */}
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <Image className="w-4 h-4 text-[#78716C]" />
            <h2 className="text-sm font-semibold text-[#1C1917]">Photos pending review</h2>
            <span className="text-xs bg-stone-200 text-stone-600 px-2 py-0.5 rounded-full font-medium">{photos.length}</span>
          </div>

          {photos.length === 0 ? (
            <div className="bg-white border border-[#E7E5E4] rounded-xl p-6 text-center">
              <p className="text-sm text-[#78716C]">All caught up.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {photos.map(photo => {
                return (
                <div key={photo.id} className="bg-white border border-[#E7E5E4] rounded-xl overflow-hidden">
                  <div className="aspect-square bg-stone-100 relative">
                    <img
                      src={photo.signedUrl ?? ''}
                      alt={`Photo by ${photo.profiles?.pseudonym ?? 'user'}`}
                      className="absolute inset-0 w-full h-full object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                    />
                  </div>
                  <div className="p-3">
                    <p className="text-xs font-semibold text-[#1C1917] truncate">
                      {photo.profiles?.pseudonym ?? photo.user_id.slice(0, 8)}
                    </p>
                    <p className="text-xs text-[#A8A29E]">
                      {photo.is_primary ? 'Primary' : 'Additional'} · {new Date(photo.created_at).toLocaleDateString()}
                    </p>
                    <PhotoActions
                      photoId={photo.id}
                      onDone={id => setPhotos(p => p.filter(x => x.id !== id))}
                    />
                  </div>
                </div>
                )
              })}
            </div>
          )}
        </section>

        {/* Verification */}
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <ShieldCheck className="w-4 h-4 text-[#16A34A]" />
            <h2 className="text-sm font-semibold text-[#1C1917]">Verification submissions</h2>
            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">{verifications.length}</span>
          </div>

          {verifications.length === 0 ? (
            <div className="bg-white border border-[#E7E5E4] rounded-xl p-6 text-center">
              <p className="text-sm text-[#78716C]">No pending verifications.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {verifications.map(v => {
                const p = v.profiles
                const height = p ? `${p.height_ft}'${p.height_in || 0}"` : null
                return (
                  <div key={v.id} className="bg-white border border-[#E7E5E4] rounded-xl p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="text-sm font-semibold text-[#1C1917]">
                          {p?.pseudonym ?? v.user_id.slice(0, 8)}
                          {height && (
                            <span className="ml-2 font-mono text-[#D97706] text-xs">{height}</span>
                          )}
                        </p>
                        <p className="text-xs text-[#A8A29E]">
                          Submitted {new Date(v.submitted_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-[#78716C] bg-stone-50 rounded-lg px-3 py-2 font-mono break-all mb-1">
                      {v.photo_path}
                    </p>
                    <VerifyActions
                      submissionId={v.id}
                      onDone={id => setVerifications(vs => vs.filter(x => x.id !== id))}
                    />
                  </div>
                )
              })}
            </div>
          )}
        </section>

        {/* Reports */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Flag className="w-4 h-4 text-red-500" />
            <h2 className="text-sm font-semibold text-[#1C1917]">Reports pending review</h2>
            <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium">{reports.length}</span>
          </div>

          {reports.length === 0 ? (
            <div className="bg-white border border-[#E7E5E4] rounded-xl p-6 text-center">
              <p className="text-sm text-[#78716C]">No pending reports.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {reports.map(report => (
                <div key={report.id} className="bg-white border border-[#E7E5E4] rounded-xl p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-sm font-semibold text-[#1C1917] capitalize">
                        {report.category.replace(/_/g, ' ')}
                      </p>
                      <p className="text-xs text-[#78716C]">
                        {report.reporter?.pseudonym ?? 'unknown'} reported {report.reported?.pseudonym ?? 'unknown'}
                      </p>
                    </div>
                    <span className="text-xs text-[#A8A29E] shrink-0 ml-2">
                      {new Date(report.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  {report.description && (
                    <p className="text-xs text-[#44403C] bg-stone-50 rounded-lg px-3 py-2 leading-relaxed mb-1">
                      {report.description}
                    </p>
                  )}

                  <div className="flex gap-2 mt-1">
                    <Link
                      href={`/profile/${report.reported?.pseudonym ?? ''}`}
                      className="text-xs text-[#D97706] hover:underline"
                      target="_blank"
                    >
                      View profile
                    </Link>
                  </div>

                  <ReportActions
                    reportId={report.id}
                    onDone={id => setReports(r => r.filter(x => x.id !== id))}
                  />
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
