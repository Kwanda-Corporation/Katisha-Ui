import { useTranslation } from 'react-i18next'
import StudioShell from '../../components/studio/StudioShell'
import StudioHeading from '../../components/studio/StudioHeading'
import StudioCard from '../../components/studio/StudioCard'
import EmptyState from '../../components/studio/EmptyState'

export default function PromoterDashboard() {
  const { t } = useTranslation()

  return (
    <StudioShell>
      <div className="space-y-8">
        <div>
          <StudioHeading>{t('promoter.promoterDashboard')}</StudioHeading>
          <p className="mt-2 text-[var(--text-sub)]">{t('promoter.dashboard')}</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StudioCard>
            <h3 className="text-sm font-medium text-[var(--text-sub)]">{t('promoter.totalEarnings')}</h3>
            <p className="mt-2 text-2xl font-semibold text-[var(--text)]">0 RWF</p>
          </StudioCard>
          <StudioCard>
            <h3 className="text-sm font-medium text-[var(--text-sub)]">{t('promoter.pendingEarnings')}</h3>
            <p className="mt-2 text-2xl font-semibold text-[var(--text)]">0 RWF</p>
          </StudioCard>
          <StudioCard>
            <h3 className="text-sm font-medium text-[var(--text-sub)]">{t('promoter.paidEarnings')}</h3>
            <p className="mt-2 text-2xl font-semibold text-[var(--text)]">0 RWF</p>
          </StudioCard>
        </div>
        <StudioCard>
          <EmptyState
            svgSrc="/youtube_graphic_no_content_illustration_v4.svg"
            svgAlt={t('promoter.noReferrals')}
            title={t('promoter.noReferrals')}
            description={t('studio.startSearchingDescription')}
          />
        </StudioCard>
      </div>
    </StudioShell>
  )
}
