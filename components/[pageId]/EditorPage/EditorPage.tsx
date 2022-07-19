import { Page } from '@prisma/client';
import charmClient from 'charmClient';
import ErrorPage from 'components/common/errors/ErrorPage';
import { useBounties } from 'hooks/useBounties';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { usePages } from 'hooks/usePages';
import { usePageTitle } from 'hooks/usePageTitle';
import { useUser } from 'hooks/useUser';
import debouncePromise from 'lib/utilities/debouncePromise';
import log from 'loglevel';
import { useCallback, useEffect, useMemo, useState } from 'react';
import BoardPage from '../BoardPage';
import DocumentPage from '../DocumentPage';

export default function EditorPage ({ pageId }: { pageId: string }) {
  const { setIsEditing, pages, setCurrentPageId, setPages, getPagePermissions } = usePages();
  const { bounties } = useBounties();
  const [, setTitleState] = usePageTitle();
  const [pageNotFound, setPageNotFound] = useState(false);
  const [space] = useCurrentSpace();
  const [isAccessDenied, setIsAccessDenied] = useState(false);
  const [user] = useUser();
  const currentPagePermissions = getPagePermissions(pageId);

  const pagesLoaded = Object.keys(pages).length > 0;
  const cardId = (new URLSearchParams(window.location.search)).get('cardId');

  const pageBounty = useMemo(() => {
    return bounties.find(bounty => bounty.linkedTaskId === cardId);
  }, [pages, bounties, cardId]);

  useEffect(() => {
    async function main () {
      setIsAccessDenied(false);
      if (pageId && pagesLoaded && space) {
        try {
          const page = await charmClient.getPage(pageId, space.id);
          if (page) {
            setPages((_pages) => ({ ..._pages, [page.id]: page }));
            setPageNotFound(false);
            setCurrentPageId(page.id);
            setTitleState(page.title);
          }
          else {
            setPageNotFound(true);
          }
        }
        catch (err: any) {
          // An error will be thrown if page doesn't exist or if you dont have read permission for the page
          if (err.errorType === 'Access denied') {
            setIsAccessDenied(true);
          }
          // If the page doesn't exist an error will be thrown
          setPageNotFound(true);
        }
      }
    }
    main();

    return () => {
      setCurrentPageId('');
    };

  }, [pageId, pagesLoaded, space, user]);

  const debouncedPageUpdate = debouncePromise(async (updates: Partial<Page>) => {
    setIsEditing(true);
    const updatedPage = await charmClient.updatePage(updates);
    setPages((_pages) => ({
      ..._pages,
      [pageId]: updatedPage
    }));
    return updatedPage;
  }, 500);

  const setPage = useCallback(async (updates: Partial<Page>) => {
    if (!pageId) {
      return;
    }
    if (updates.hasOwnProperty('title')) {
      setTitleState(updates.title || 'Untitled');
    }
    debouncedPageUpdate({ id: pageId, ...updates } as Partial<Page>)
      .catch((err: any) => {
        log.error('Error saving page', err);
      })
      .finally(() => {
        setIsEditing(false);
      });
  }, [pageId]);

  // memoize the page to avoid re-rendering unless certain fields are changed
  const currentPage = pages[pageId];
  const memoizedCurrentPage = useMemo(
    () => pages[pageId],
    [pageId, currentPage?.headerImage, currentPage?.icon, currentPage?.title, currentPage?.deletedAt, currentPage?.fullWidth]
  );

  if (isAccessDenied) {
    return <ErrorPage message={'Sorry, you don\'t have access to this page'} />;
  }
  else if (pageNotFound) {
    return <ErrorPage message={'Sorry, that page doesn\'t exist'} />;
  }
  // Wait for permission load
  else if (!memoizedCurrentPage || !currentPagePermissions) {
    return null;
  }
  // Interpret page permission
  else if (currentPagePermissions.read === false) {
    return <ErrorPage message={'Sorry, you don\'t have access to this page'} />;
  }
  else if (currentPagePermissions.read === true) {
    if (currentPage?.type === 'board') {
      return (
        <BoardPage
          bounty={pageBounty}
          page={memoizedCurrentPage}
          setPage={setPage}
          readonly={currentPagePermissions.edit_content !== true}
        />
      );
    }
    else {
      return (
        <DocumentPage
          page={memoizedCurrentPage}
          setPage={setPage}
          readOnly={currentPagePermissions.edit_content !== true}
        />
      );
    }
  }
  return null;
}
