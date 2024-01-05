import type { ReactNode } from 'react';

import { ProposalsProvider } from 'components/proposals/hooks/useProposals';
import { DbViewSettingsProvider } from 'hooks/useLocalDbViewSettings';
import { ProposalBlocksProvider } from 'hooks/useProposalBlocks';

import { ProposalsBoardProvider } from './hooks/useProposalsBoard';

export function ProposalsDataProvider({ children }: { children: ReactNode }) {
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
