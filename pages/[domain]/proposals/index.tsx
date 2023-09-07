import getPageLayout from 'components/common/PageLayout/getLayout';
import { ProposalsPage } from 'components/proposals/ProposalsPage';
import { useFeaturesAndMembers } from 'hooks/useFeaturesAndMemberProfiles';
import { setTitle } from 'hooks/usePageTitle';
import { ProposalBlocksProvider } from 'hooks/useProposalBlocks';

export default function ProposalsPageComponent() {
  const { mappedFeatures } = useFeaturesAndMembers();
  const proposalTitle = mappedFeatures.proposals.title;

  setTitle(proposalTitle);

  return (
    <ProposalBlocksProvider>
      <ProposalsPage title={proposalTitle} />
    </ProposalBlocksProvider>
  );
}

ProposalsPageComponent.getLayout = getPageLayout;
