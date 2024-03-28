import { useGetPageMeta } from 'charmClient/hooks/pages';
import { usePages } from 'hooks/usePages';
import type { PageMetaLite } from 'lib/pages/interfaces';

// get page meta from usePages if it exists, otherwise fetch it
export function useGetPageMetaFromCache({ pageId }: { pageId?: string | null }): {
  isLoading: boolean;
  page?: PageMetaLite;
} {
  const { pages, loadingPages } = usePages();
  const pageFromPagesContext = pageId ? pages[pageId] : undefined;

  // retrieve the page directly if we are waiting for pages to load
  const { data: sourcePage, isLoading: isPageLoading } = useGetPageMeta(
    !pageFromPagesContext && pageId ? pageId : null
  );
  const documentPage = sourcePage || pageFromPagesContext;
  const isLoading = Boolean(pageId && (isPageLoading || loadingPages));
  return { page: documentPage, isLoading };
}
