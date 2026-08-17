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

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-[440px]">
          <div className="lg:hidden flex items-center justify-center mb-8">
            <Logo />
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}
