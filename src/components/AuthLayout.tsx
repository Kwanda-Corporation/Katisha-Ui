import { ReactNode } from 'react'
import Logo from './ui/Logo'

interface AuthLayoutProps {
  children: ReactNode
  title: string
  subtitle: string
  illustration?: ReactNode
  hideSidebar?: boolean
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex bg-white">

      {/* Top-aligned on phones: with items-center a form taller than the
          viewport gets clipped at the top and becomes unreachable. */}
      <div className="flex-1 flex items-start lg:items-center justify-center px-4 sm:px-6 py-8 lg:py-6">
        <div className="w-full max-w-[440px] min-w-0">
          <div className="lg:hidden flex items-center justify-center mb-8">
            <Logo />
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}
