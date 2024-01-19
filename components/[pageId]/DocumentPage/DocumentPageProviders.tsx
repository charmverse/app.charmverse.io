import { PageSidebarProvider } from 'components/[pageId]/DocumentPage/hooks/usePageSidebar';
import { ProposalsProvider } from 'components/proposals/hooks/useProposals';
import { CharmEditorProvider } from 'hooks/useCharmEditor';
import { CurrentPageProvider } from 'hooks/useCurrentPage';
import { ThreadsProvider } from 'hooks/useThreads';
import { VotesProvider } from 'hooks/useVotes';
// context that is needed for DocumentPage to work
export function DocumentPageProviders({ children }: { children: React.ReactNode }) {
  return (
    <CurrentPageProvider>
      <CharmEditorProvider>
        <ThreadsProvider>
          <VotesProvider>
            <ProposalsProvider>
              <PageSidebarProvider>{children}</PageSidebarProvider>
            </ProposalsProvider>
          </VotesProvider>
        </ThreadsProvider>
      </CharmEditorProvider>
    </CurrentPageProvider>
  );
}
