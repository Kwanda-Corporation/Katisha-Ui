import { useState } from 'react'
import { useNavigate } from 'react-router'
import { useTranslation } from 'react-i18next'
import Logo from '../../components/ui/Logo'
import SEO from '../../components/ui/SEO'

export default function PromoterSetup() {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [form, setForm] = useState({
    name: '',
    phone: '',
    payoutPhone: '',
    useDifferentPayout: false,
    password: '',
    acceptTerms: false,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Visual-only for now
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <SEO title={t('promoter.setup')} noindex />
      <div className="px-6 sm:px-8 pt-6 sm:pt-8 pb-4">
        <Logo />
      </div>
      <div className="flex-1 flex items-center justify-center px-6 pb-20">
        <div className="w-full max-w-[440px]">
          <div className="text-center mb-8">
            <h1 className="font-[var(--font-body)] text-[1.75rem] font-semibold text-[var(--text)]">
              {t('promoter.setup')}
            </h1>
            <p className="font-[var(--font-body)] text-sm text-[var(--text-sub)] mt-2">
              {t('promoter.setupDescription')}
            </p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--text)] mb-1">{t('auth.name')}</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-4 py-3 rounded-md border border-[var(--border)] bg-white text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--blue)] focus:ring-opacity-20"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text)] mb-1">{t('auth.phone')}</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full px-4 py-3 rounded-md border border-[var(--border)] bg-white text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--blue)] focus:ring-opacity-20"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="different"
                checked={form.useDifferentPayout}
                onChange={(e) => setForm({ ...form, useDifferentPayout: e.target.checked })}
              />
              <label htmlFor="different" className="text-sm text-[var(--text-sub)]">
                Use a different number for payouts
              </label>
            </div>
            {form.useDifferentPayout && (
              <div>
                <label className="block text-sm font-medium text-[var(--text)] mb-1">{t('promoter.payoutNumber')}</label>
                <input
                  type="tel"
                  value={form.payoutPhone}
                  onChange={(e) => setForm({ ...form, payoutPhone: e.target.value })}
                  className="w-full px-4 py-3 rounded-md border border-[var(--border)] bg-white text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--blue)] focus:ring-opacity-20"
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-[var(--text)] mb-1">{t('auth.password')}</label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full px-4 py-3 rounded-md border border-[var(--border)] bg-white text-[var(--text)] focus:outline-none focus:ring-2 focus:ring-[var(--blue)] focus:ring-opacity-20"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="terms"
                checked={form.acceptTerms}
                onChange={(e) => setForm({ ...form, acceptTerms: e.target.checked })}
              />
              <label htmlFor="terms" className="text-xs text-[var(--text-sub)]">
                I accept the terms. Purchases made by promoters through their own link do not earn commission.
              </label>
            </div>
            <button
              type="submit"
              disabled={!form.acceptTerms}
              className="w-full p-4 rounded-md bg-[var(--blue)] text-white font-semibold disabled:opacity-50"
            >
              {t('common.submit')}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
