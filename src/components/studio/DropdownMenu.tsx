import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

export interface DropdownItem {
  key: string
  label: string
  icon?: React.ReactNode
  onClick: () => void
  danger?: boolean
}

interface DropdownMenuProps {
  trigger: React.ReactNode
  items: DropdownItem[]
  className?: string
  align?: 'left' | 'right'
}

const MENU_WIDTH = 184

/**
 * Row-action menu. The panel is portalled to <body> and positioned with fixed
 * coordinates so it is never clipped by a scrolling table/card (dashboard
 * tables scroll horizontally on phones) and never runs off-screen.
 */
export default function DropdownMenu({ trigger, items, className = '', align = 'left' }: DropdownMenuProps) {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState<{ top?: number; bottom?: number; left: number } | null>(null)
  const [theme, setTheme] = useState('light')
  const ref = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node
      if (ref.current?.contains(target) || menuRef.current?.contains(target)) return
      setOpen(false)
    }
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [])

  useLayoutEffect(() => {
    if (!open) { setPos(null); return }
    // The panel is portalled out of the themed shell, so carry the scheme with it.
    const shell = ref.current?.closest('[data-theme]') as HTMLElement | null
    setTheme(shell?.dataset.theme ?? 'light')

    const place = () => {
      const rect = ref.current?.getBoundingClientRect()
      if (!rect) return
      const margin = 8
      let left = align === 'right' ? rect.right - MENU_WIDTH : rect.left
      left = Math.min(Math.max(margin, left), window.innerWidth - MENU_WIDTH - margin)

      // Open upwards when there is not enough room underneath.
      const spaceBelow = window.innerHeight - rect.bottom
      if (spaceBelow < 240 && rect.top > spaceBelow) {
        setPos({ bottom: Math.max(margin, window.innerHeight - rect.top + 8), left })
      } else {
        setPos({ top: rect.bottom + 8, left })
      }
    }

    place()
    const onMove = () => place()
    window.addEventListener('resize', onMove)
    window.addEventListener('scroll', onMove, true)
    return () => {
      window.removeEventListener('resize', onMove)
      window.removeEventListener('scroll', onMove, true)
    }
  }, [open, align])

  return (
    <div className={`relative ${className}`} ref={ref}>
      <div onClick={() => setOpen(!open)}>{trigger}</div>
      {open && pos && createPortal(
        <div
          ref={menuRef}
          data-theme={theme}
          className="theme-tokens fixed z-[1200] py-1.5 bg-[var(--studio-surface)] border border-[var(--studio-border)] rounded-[var(--studio-radius-pop)] shadow-[var(--studio-shadow-pop)] max-w-[calc(100vw-16px)] overflow-y-auto"
          style={{ top: pos.top, bottom: pos.bottom, left: pos.left, width: MENU_WIDTH }}
          role="menu"
        >
          {items.map((item) => (
            <button
              key={item.key}
              role="menuitem"
              type="button"
              onClick={() => {
                setOpen(false)
                item.onClick()
              }}
              className={`flex items-center gap-2.5 w-full px-4 py-2 text-sm text-left hover:bg-[var(--studio-muted-fill)] cursor-pointer ${
                item.danger ? 'text-[var(--error)]' : 'text-[var(--studio-text)]'
              }`}
            >
              {item.icon && <span className="flex items-center shrink-0">{item.icon}</span>}
              <span className="truncate">{item.label}</span>
            </button>
          ))}
        </div>,
        document.body,
      )}
    </div>
  )
}
