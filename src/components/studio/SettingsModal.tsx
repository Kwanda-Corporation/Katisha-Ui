import { ReactNode, useState } from 'react'
import Modal from '../ui/Modal'

interface SettingsSection {
  id: string
  label: string
  icon?: ReactNode
  content: ReactNode
}

interface SettingsModalProps {
  open: boolean
  onClose: () => void
  title?: string
  sections: SettingsSection[]
}

export default function SettingsModal({ open, onClose, title = 'Settings', sections }: SettingsModalProps) {
  const [activeSection, setActiveSection] = useState(sections[0]?.id || '')

  return (
    <Modal open={open} onClose={onClose} labelledBy="settings-modal-title" maxWidth={960}>
      <div className="flex h-[600px] max-h-[80vh]">
        {/* Left sidebar */}
        <div className="w-48 sm:w-56 border-r border-[var(--studio-border)] bg-[var(--studio-surface-sub)] p-4 overflow-y-auto">
          <h2 id="settings-modal-title" className="text-lg font-semibold text-[var(--text)] mb-4">
            {title}
          </h2>
          <nav className="space-y-1">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-left transition-colors }
              >
                {section.icon}
                {section.label}
              </button>
            ))}
          </nav>
        </div>
        {/* Content */}
        <div className="flex-1 p-6 overflow-y-auto">{sections.find((s) => s.id === activeSection)?.content}</div>
      </div>
    </Modal>
  )
}
