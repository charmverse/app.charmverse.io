import { ProposalsProvider } from 'components/proposals/hooks/useProposals';
import { ProposalsBoardProvider } from 'components/proposals/hooks/useProposalsBoard';
import { ProposalsPage } from 'components/proposals/ProposalsPageV2';
import { useFeaturesAndMembers } from 'hooks/useFeaturesAndMemberProfiles';
import { setTitle } from 'hooks/usePageTitle';
import { ProposalBlocksProvider } from 'hooks/useProposalBlocks';

export function ProposalsPageWithProviders() {
  const { mappedFeatures } = useFeaturesAndMembers();
  const proposalTitle = mappedFeatures.proposals.title;

  setTitle(proposalTitle);

  return (
    <ProposalsProvider>
      <ProposalBlocksProvider>
        <ProposalsBoardProvider>
          <ProposalsPage title={proposalTitle} />
        </ProposalsBoardProvider>
      </ProposalBlocksProvider>
    </ProposalsProvider>
  );
}
