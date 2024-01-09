import type { ReactNode } from 'react';

import { DbViewSettingsProvider } from 'hooks/useLocalDbViewSettings';
import { ProposalBlocksProvider } from 'hooks/useProposalBlocks';

import { ProposalsBoardProvider } from './hooks/useProposalsBoard';

export function ProposalsPageProviders({ children }: { children: ReactNode }) {
  return (
    <DbViewSettingsProvider>
      <ProposalsBoardProvider>{children}</ProposalsBoardProvider>
    </DbViewSettingsProvider>
  );
}
