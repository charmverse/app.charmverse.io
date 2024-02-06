import { Box } from '@mui/material';
import { memo } from 'react';

import { PageSidebarProvider } from 'components/[pageId]/DocumentPage/hooks/usePageSidebar';
import { ProposalsProvider } from 'components/proposals/hooks/useProposals';
import { CharmEditorProvider } from 'hooks/useCharmEditor';
import { CharmEditorViewProvider } from 'hooks/useCharmEditorView';
import { CurrentPageProvider } from 'hooks/useCurrentPage';
import { ThreadsProvider } from 'hooks/useThreads';
import { VotesProvider } from 'hooks/useVotes';
// context that is needed for DocumentPage to work

// a memoized layer to prevent rendering when CharmEditorView changes
const MemoizedBlock = memo(Box);

export function DocumentPageProviders({ children }: { children: React.ReactNode }) {
  return (
    <CurrentPageProvider>
      <CharmEditorProvider>
        <ThreadsProvider>
          <VotesProvider>
            <ProposalsProvider>
              <CharmEditorViewProvider>
                <MemoizedBlock>
                  <PageSidebarProvider>{children}</PageSidebarProvider>
                </MemoizedBlock>
              </CharmEditorViewProvider>
            </ProposalsProvider>
          </VotesProvider>
        </ThreadsProvider>
      </CharmEditorProvider>
    </CurrentPageProvider>
  );
}
