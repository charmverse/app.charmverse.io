import charmClient from 'charmClient';
import type { PageDetails, PageDetailsUpdates } from 'lib/pages';
import debounce from 'lodash/debounce';
import { useCallback, useEffect, useMemo } from 'react';
import useSWR from 'swr';

export function usePageDetails (pageIdOrPath: string, spaceId?: string) {
  const { data: pageDetails, error, mutate } = useSWR([`pages/details/${pageIdOrPath}`, spaceId], () => charmClient.pages.getPageDetails(pageIdOrPath, spaceId));

  const mutatePageDetails = useCallback((updates: PageDetailsUpdates, revalidate = false) => {
    mutate(pageDetailsData => {
      return pageDetailsData ? { ...pageDetailsData, ...updates } : ({ ...updates } as PageDetails);
    }, {
      revalidate
    });
  }, [mutate]);

  const updatePageDetails = useCallback(async (updates: PageDetailsUpdates) => {
    const updatedPage = await charmClient.pages.updatePage(updates);
    const updatedDetails: PageDetails = {
      id: updatedPage.id,
      content: updatedPage.content,
      contentText: updatedPage.contentText
    };

    // check if updated page isEmpty changes and update relatively usePages cache
    // hasContent(pageDetails.content) !== hasContent(updatedDetails.content)

    mutatePageDetails(updatedDetails);
  }, [mutatePageDetails]);

  const debouncedUpdatePageDetails = useMemo(
    () => debounce(updatePageDetails, 500),
    []
  );

  useEffect(() => {
    return () => {
      debouncedUpdatePageDetails.cancel();
    };
  }, []);

  return { pageDetails, error, updatePageDetails, debouncedUpdatePageDetails };
}
