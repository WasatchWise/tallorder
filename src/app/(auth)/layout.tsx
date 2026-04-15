import Link from 'next/link'
import Image from 'next/image'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#FAFAF9] flex flex-col">
      {/* Auth nav */}
      <nav className="bg-[#1C1917] h-14 flex items-center px-4">
        <Link href="/">
          <Image
            src="/images/logo-dark.png"
            alt="Tall Order"
            width={160}
            height={43}
            className="h-9 w-auto"
            priority
          />
        </Link>
      </nav>

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        {children}
      </div>
    </div>
  )
}
