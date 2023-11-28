import { useTrackPageView } from 'charmClient/hooks/track';
import getPageLayout from 'components/common/PageLayout/getLayout';
import { ProposalsPageWithProviders } from 'components/proposals/ProposalsPageWithProviders';
import { setTitle } from 'hooks/usePageTitle';
import { useSpaceFeatures } from 'hooks/useSpaceFeatures';

export default function ProposalsPageComponent() {
  useTrackPageView({ type: 'proposals_list' });
  const { mappedFeatures } = useSpaceFeatures();
  const proposalTitle = mappedFeatures.proposals.title;

  setTitle(proposalTitle);

  return <ProposalsPageWithProviders title={proposalTitle} />;
}

ProposalsPageComponent.getLayout = getPageLayout;
