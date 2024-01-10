import type { ReactNode } from 'react';

import { PageDialogProvider } from 'components/common/PageDialog/hooks/usePageDialog';
import { ProposalsProvider } from 'components/proposals/hooks/useProposals';
import { DbViewSettingsProvider } from 'hooks/useLocalDbViewSettings';
import { ProposalBlocksProvider } from 'hooks/useProposalBlocks';

import { ProposalsBoardProvider } from './hooks/useProposalsBoard';

export function ProposalsPageProviders({ children }: { children: ReactNode }) {
  return (
    <ProposalsProvider>
      <DbViewSettingsProvider>
        <ProposalBlocksProvider>
          <ProposalsBoardProvider>{children}</ProposalsBoardProvider>
        </ProposalBlocksProvider>
      </DbViewSettingsProvider>
    </ProposalsProvider>
  );
}
