import { ReactNode } from 'react'

interface StudioHeadingProps {
  children: ReactNode
  className?: string
  centered?: boolean
}

export default function StudioHeading({ children, className = '', centered = false }: StudioHeadingProps) {
  return (
    <h2
      className={ont-semibold text-3xl sm:text-5xl text-black  }
    >
      {children}
    </h2>
  )
}
