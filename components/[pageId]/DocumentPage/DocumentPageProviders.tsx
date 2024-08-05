import type { ReactNode } from 'react';

import { ProposalsProvider } from 'components/proposals/hooks/useProposals';
import { CharmEditorProvider } from 'hooks/useCharmEditor';
import { CharmEditorViewProvider } from 'hooks/useCharmEditorView';
import { CurrentPageProvider } from 'hooks/useCurrentPage';
import { ThreadsProvider } from 'hooks/useThreads';
import { VotesProvider } from 'hooks/useVotes';

// context that is needed for DocumentPage to work
export function DocumentPageProviders({ children }: { children: React.ReactNode }) {
  return (
    <CharmEditorViewProvider>
      <CurrentPageProvider>
        <CharmEditorProvider>
          <ThreadsProvider>
            <VotesProvider>
              <ProposalsProvider>{children}</ProposalsProvider>
            </VotesProvider>
          </ThreadsProvider>
        </CharmEditorProvider>
      </CurrentPageProvider>
    </CharmEditorViewProvider>
  );
}
