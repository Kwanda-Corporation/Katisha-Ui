interface SpinnerProps {
  size?: number
  className?: string
}

export default function Spinner({ size = 24, className = '' }: SpinnerProps) {
  return (
    <span
      role="status"
      aria-label="Loading"
      className={`inline-block rounded-full border-2 border-[var(--blue-bg)] border-t-[var(--blue)] animate-spin ${className}`}
      style={{ width: size, height: size }}
    />
  )
}
