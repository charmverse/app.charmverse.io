import type { ReactNode } from 'react';

import { PageDialogProvider } from 'components/common/PageDialog/hooks/usePageDialog';
import { PageDialogGlobal } from 'components/common/PageDialog/PageDialogGlobal';
import { ProposalDialogProvider } from 'components/proposals/components/ProposalDialog/hooks/useProposalDialog';
import { ProposalsProvider } from 'components/proposals/hooks/useProposals';
import { DbViewSettingsProvider } from 'hooks/useLocalDbViewSettings';
import { ProposalBlocksProvider } from 'hooks/useProposalBlocks';

import { ProposalsBoardProvider } from './hooks/useProposalsBoard';

export function ProposalsPageProviders({ children }: { children: ReactNode }) {
  return (
    <PageDialogProvider>
      <ProposalsProvider>
        <DbViewSettingsProvider>
          <ProposalBlocksProvider>
            <ProposalsBoardProvider>
              <ProposalDialogProvider>
                {children}
                <PageDialogGlobal />
              </ProposalDialogProvider>
            </ProposalsBoardProvider>
          </ProposalBlocksProvider>
        </DbViewSettingsProvider>
      </ProposalsProvider>
    </PageDialogProvider>
  );
}
