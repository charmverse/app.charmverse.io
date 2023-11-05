import { useTrackPageView } from 'charmClient/hooks/track';
import getPageLayout from 'components/common/PageLayout/getLayout';
import { ProposalsPageWithProviders } from 'components/proposals/ProposalsPageWithProviders';

export default function ProposalsPageComponent() {
  useTrackPageView({ type: 'proposals_list' });

  return <ProposalsPageWithProviders />;
}

ProposalsPageComponent.getLayout = getPageLayout;
