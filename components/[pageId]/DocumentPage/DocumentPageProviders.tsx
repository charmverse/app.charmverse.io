import { CharmEditorProvider } from 'hooks/useCharmEditor';
import { CurrentPageProvider } from 'hooks/useCurrentPage';
import { PageSidebarProvider } from 'hooks/usePageSidebar';
import { ThreadsProvider } from 'hooks/useThreads';
import { VotesProvider } from 'hooks/useVotes';

// context that is needed for DocumentPage to work
export function DocumentPageProviders({
  children,
  isInsideDialog
}: {
  children: React.ReactNode;
  isInsideDialog?: boolean;
}) {
  return (
    <CurrentPageProvider>
      <CharmEditorProvider>
        <ThreadsProvider>
          <VotesProvider>
            <PageSidebarProvider isInsideDialog={isInsideDialog}>{children}</PageSidebarProvider>
          </VotesProvider>
        </ThreadsProvider>
      </CharmEditorProvider>
    </CurrentPageProvider>
  );
}
