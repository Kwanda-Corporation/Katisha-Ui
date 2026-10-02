import { useTranslation } from 'react-i18next'
import StudioShell from '../../components/studio/StudioShell'
import StudioHeading from '../../components/studio/StudioHeading'
import StudioCard from '../../components/studio/StudioCard'
import EmptyState from '../../components/studio/EmptyState'

export default function PromoterEarnings() {
  const { t } = useTranslation()

  return (
    <StudioShell>
      <div className="space-y-8">
        <div>
          <StudioHeading>{t('promoter.earnings')}</StudioHeading>
        </div>
        <StudioCard>
          <EmptyState
            svgSrc="/youtube_graphic_no_content_illustration_v4.svg"
            svgAlt={t('promoter.noEarnings')}
            title={t('promoter.noEarnings')}
            description={t('studio.startSearchingDescription')}
          />
        </StudioCard>
      </div>
    </StudioShell>
  )
}
