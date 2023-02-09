import { CharmEditorProvider } from 'hooks/useCharmEditor';
import { FocusedPageProvider } from 'hooks/useFocusedPage';
import { PageActionDisplayProvider } from 'hooks/usePageActionDisplay';
import { ThreadsProvider } from 'hooks/useThreads';
import { VotesProvider } from 'hooks/useVotes';

// context that is needed for DocumentPage to work
export function DocumentPageProviders({ children }: { children: React.ReactNode }) {
  return (
    <FocusedPageProvider>
      <CharmEditorProvider>
        <ThreadsProvider>
          <VotesProvider>
            <PageActionDisplayProvider>{children}</PageActionDisplayProvider>
          </VotesProvider>
        </ThreadsProvider>
      </CharmEditorProvider>
    </FocusedPageProvider>
  );
}
