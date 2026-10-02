import { useTranslation } from 'react-i18next'
import StudioShell from '../../components/studio/StudioShell'
import StudioHeading from '../../components/studio/StudioHeading'
import StudioCard from '../../components/studio/StudioCard'

export default function PromoterSettings() {
  const { t } = useTranslation()

  return (
    <StudioShell>
      <div className="space-y-8">
        <div>
          <StudioHeading>{t('studio.settings')}</StudioHeading>
        </div>
        <StudioCard>
          <p className="text-[var(--text-sub)]">Promoter settings coming soon.</p>
        </StudioCard>
      </div>
    </StudioShell>
  )
}
