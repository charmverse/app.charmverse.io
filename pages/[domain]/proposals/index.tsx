import getPageLayout from 'components/common/PageLayout/getLayout';
import { ProposalsPage } from 'components/proposals/ProposalsPage';
import { useFeaturesAndMembers } from 'hooks/useFeaturesAndMemberProfiles';
import { setTitle } from 'hooks/usePageTitle';

export default function ProposalsPageComponent() {
  const { features } = useFeaturesAndMembers();
  const proposalTitle = features.find((f) => f.id === 'proposals')?.title || 'Proposals';

  setTitle(proposalTitle);

  return <ProposalsPage title={proposalTitle} />;
}

ProposalsPageComponent.getLayout = getPageLayout;
