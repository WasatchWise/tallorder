import Link from 'next/link'
import Image from 'next/image'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#F5F5F4] flex flex-col items-center justify-center px-4">
      <div className="text-center max-w-sm">
        {/* Logo */}
        <div className="mb-6">
          <Image
            src="/images/logo-dark.png"
            alt="Tall Order"
            width={200}
            height={54}
            className="h-10 w-auto mx-auto"
          />
        </div>

        {/* 404 */}
        <p className="text-6xl font-bold text-[#E7E5E4] mb-4" style={{ fontFamily: 'monospace' }}>404</p>
        <h1 className="text-xl font-bold text-[#1C1917] mb-2">Page not found</h1>
        <p className="text-sm text-[#78716C] mb-8">
          That page does not exist. It may have moved or the link is broken.
        </p>

        <Link
          href="/"
          className="inline-block bg-[#D97706] hover:bg-[#B45309] text-white font-semibold px-6 py-3 rounded-xl transition-colors duration-150 text-sm"
        >
          Back to home
        </Link>
      </div>
    </div>
  )
}
