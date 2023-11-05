import { ProposalDialogProvider } from 'components/proposals/components/ProposalDialog/hooks/useProposalDialog';
import ProposalDialogGlobal from 'components/proposals/components/ProposalDialog/ProposalDialogGlobal';
import { ProposalsProvider } from 'components/proposals/hooks/useProposals';
import { ProposalsBoardProvider } from 'components/proposals/hooks/useProposalsBoard';
import { ProposalsPage } from 'components/proposals/ProposalsPage';
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
          <ProposalDialogProvider>
            <ProposalsPage title={proposalTitle} />
            <ProposalDialogGlobal />
          </ProposalDialogProvider>
        </ProposalsBoardProvider>
      </ProposalBlocksProvider>
    </ProposalsProvider>
  );
}
