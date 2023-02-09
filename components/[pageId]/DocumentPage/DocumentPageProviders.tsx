import { FocusedPageProvider } from 'hooks/useFocusedPage';
import { PageActionDisplayProvider } from 'hooks/usePageActionDisplay';
import { PrimaryCharmEditorProvider } from 'hooks/usePrimaryCharmEditor';
import { ThreadsProvider } from 'hooks/useThreads';
import { VotesProvider } from 'hooks/useVotes';

// context that is needed for DocumentPage to work
export function DocumentPageProviders({ children }: { children: React.ReactNode }) {
  return (
    <FocusedPageProvider>
      <PrimaryCharmEditorProvider>
        <ThreadsProvider>
          <VotesProvider>
            <PageActionDisplayProvider>{children}</PageActionDisplayProvider>
          </VotesProvider>
        </ThreadsProvider>
      </PrimaryCharmEditorProvider>
    </FocusedPageProvider>
  );
}
