import { ProposalDialogProvider } from 'components/proposals/components/ProposalDialog/hooks/useProposalDialog';
import { ProposalsProvider } from 'components/proposals/hooks/useProposals';
import { ProposalsBoardProvider } from 'components/proposals/hooks/useProposalsBoard';
import { ProposalsPage } from 'components/proposals/ProposalsPage';
import { DbViewSettingsProvider } from 'hooks/useLocalDbViewSettings';
import { ProposalBlocksProvider } from 'hooks/useProposalBlocks';

export function ProposalsPageWithProviders({ title: proposalTitle }: { title: string }) {
  return (
    <ProposalsProvider>
      <DbViewSettingsProvider>
        <ProposalBlocksProvider>
          <ProposalsBoardProvider>
            <ProposalDialogProvider>
              <ProposalsPage title={proposalTitle} />
            </ProposalDialogProvider>
          </ProposalsBoardProvider>
        </ProposalBlocksProvider>
      </DbViewSettingsProvider>
    </ProposalsProvider>
  );
}
