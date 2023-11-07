import { useTrackPageView } from 'charmClient/hooks/track';
import getPageLayout from 'components/common/PageLayout/getLayout';
import { ProposalsPageWithProviders } from 'components/proposals/ProposalsPageWithProviders';
import { useFeaturesAndMembers } from 'hooks/useFeaturesAndMemberProfiles';
import { setTitle } from 'hooks/usePageTitle';

export default function ProposalsPageComponent() {
  useTrackPageView({ type: 'proposals_list' });
  const { mappedFeatures } = useFeaturesAndMembers();
  const proposalTitle = mappedFeatures.proposals.title;

  setTitle(proposalTitle);

  return <ProposalsPageWithProviders title={proposalTitle} />;
}

ProposalsPageComponent.getLayout = getPageLayout;
