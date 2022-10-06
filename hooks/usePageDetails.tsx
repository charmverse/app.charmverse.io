import debounce from 'lodash/debounce';
import { useCallback, useEffect, useMemo } from 'react';
import useSWR from 'swr';

import charmClient from 'charmClient';
import { usePages } from 'hooks/usePages';
import type { PageDetails, PageDetailsUpdates } from 'lib/pages';
import { checkIsContentEmpty } from 'lib/pages/checkIsContentEmpty';
import { getPreviewImageFromContent } from 'lib/pages/getPreviewImageFromContent';
import type { PageContent } from 'models';

export function usePageDetails (pageIdOrPath: string, spaceId?: string) {
  const { data: pageDetails, error, mutate: mutateDetails } = useSWR(pageIdOrPath ? `pages/details/${pageIdOrPath}` : null, () => charmClient.pages.getPageDetails(pageIdOrPath, spaceId));
  const { mutatePagesList } = usePages();

  const mutatePageDetails = useCallback((updates: PageDetailsUpdates, revalidate = false) => {
    mutateDetails(pageDetailsData => {
      return pageDetailsData ? { ...pageDetailsData, ...updates } : ({ ...updates } as PageDetails);
    }, {
      revalidate
    });
  }, [mutateDetails]);

  const updatePageDetails = useCallback(async (updates: PageDetailsUpdates) => {
    const pageId = updates.id;
    const updatedPage = await charmClient.pages.updatePage(updates);
    const updatedDetails: PageDetails = {
      id: pageId,
      content: updatedPage.content,
      contentText: updatedPage.contentText,
      spaceId: updatedPage.spaceId
    };

    const hasContent = !checkIsContentEmpty(updatedPage.content as PageContent);
    const galleryImage = getPreviewImageFromContent(updatedPage.content as PageContent);

    // Update pages context data only when hasContent value changed
    mutatePagesList(pages => {
      const currentPageData = pages?.[pageId];
      if (currentPageData && (currentPageData.hasContent !== hasContent || currentPageData.galleryImage !== galleryImage)) {
        return { ...pages, [pageId]: { ...currentPageData, hasContent, galleryImage } };
      }

      return pages;
    }, { revalidate: false });

    mutatePageDetails(updatedDetails);
  }, [mutatePageDetails]);

  const debouncedUpdatePageDetails = useMemo(
    () => {
      return debounce(updatePageDetails, 500);
    },
    [updatePageDetails]
  );

  useEffect(() => {
    return () => {
      debouncedUpdatePageDetails.cancel();
    };
  }, [updatePageDetails]);

  return { pageDetails, error, updatePageDetails, debouncedUpdatePageDetails };
}
