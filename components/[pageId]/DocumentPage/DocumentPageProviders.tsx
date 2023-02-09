import { CharmEditorProvider } from 'hooks/useCharmEditor';
import { CurrentPageProvider } from 'hooks/useCurrentPage';
import { PageActionDisplayProvider } from 'hooks/usePageActionDisplay';
import { ThreadsProvider } from 'hooks/useThreads';
import { VotesProvider } from 'hooks/useVotes';

// context that is needed for DocumentPage to work
export function DocumentPageProviders({ children }: { children: React.ReactNode }) {
  return (
    <CurrentPageProvider>
      <CharmEditorProvider>
        <ThreadsProvider>
          <VotesProvider>
            <PageActionDisplayProvider>{children}</PageActionDisplayProvider>
          </VotesProvider>
        </ThreadsProvider>
      </CharmEditorProvider>
    </CurrentPageProvider>
  );
}
