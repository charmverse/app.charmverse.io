import type { Page } from '@prisma/client';
import log from 'loglevel';
import { useCallback, useEffect, useMemo, useState } from 'react';

import charmClient from 'charmClient';
import ErrorPage from 'components/common/errors/ErrorPage';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { usePages } from 'hooks/usePages';
import { usePageTitle } from 'hooks/usePageTitle';
import { usePrimaryCharmEditor } from 'hooks/usePrimaryCharmEditor';
import { useUser } from 'hooks/useUser';
import type { PageUpdates } from 'lib/pages';
import { findParentOfType } from 'lib/pages/findParentOfType';
import debouncePromise from 'lib/utilities/debouncePromise';

import BoardPage from '../BoardPage';
import DocumentPage from '../DocumentPage';

export default function EditorPage ({ pageId }: { pageId: string }) {
  const { pages, setCurrentPageId, mutatePage, getPagePermissions, loadingPages, updatePage } = usePages();
  const { editMode, resetPageProps, setPageProps } = usePrimaryCharmEditor();
  const [, setTitleState] = usePageTitle();
  const [pageNotFound, setPageNotFound] = useState(false);
  const space = useCurrentSpace();
  const [isAccessDenied, setIsAccessDenied] = useState(false);
  const { user } = useUser();
  const currentPagePermissions = useMemo(() => getPagePermissions(pageId), [pageId]);

  const parentProposalId = findParentOfType({ pageId, pageType: 'proposal', pageMap: pages });
  const readOnly = (currentPagePermissions.edit_content === false && editMode !== 'suggesting') || editMode === 'viewing';

  useEffect(() => {
    async function main () {
      setIsAccessDenied(false);
      if (pageId && !loadingPages && space) {
        try {
          const page = await charmClient.pages.getPage(pageId, space.id);
          if (page) {
            mutatePage(page);
            setPageNotFound(false);
            setCurrentPageId(page.id);
            setTitleState(page.title);
            charmClient.track.trackAction('page_view', { spaceId: page.spaceId, pageId: page.id, type: page.type });
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

  }, [pageId, loadingPages, space, user]);

  // set page attributes of the primary charm editor
  useEffect(() => {
    if (loadingPages) {
      // wait for pages loaded for permissions to be correct
      return;
    }
    if (!editMode) {
      if (currentPagePermissions.edit_content) {
        setPageProps({ permissions: currentPagePermissions, editMode: 'editing' });
      }
      else {
        setPageProps({ permissions: currentPagePermissions, editMode: 'viewing' });
      }
    }
    else {
      // pass editMode thru to fix hot-reloading which resets the prop
      setPageProps({ permissions: currentPagePermissions, editMode });
    }
    return () => {
      resetPageProps();
    };
  }, [currentPagePermissions, loadingPages]);

  const debouncedPageUpdate = debouncePromise(async (updates: PageUpdates) => {
    setPageProps({ isSaving: true });
    const updatedPage = await updatePage(updates);
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
        setPageProps({ isSaving: false });
      });
  }, [pageId]);

  // memoize the page to avoid re-rendering unless certain fields are changed
  const currentPage = pages[pageId];
  const memoizedCurrentPage = useMemo(
    () => pages[pageId],
    [
      pageId,
      currentPage?.headerImage,
      currentPage?.icon,
      currentPage?.title,
      currentPage?.deletedAt,
      currentPage?.fullWidth,
      currentPagePermissions
    ]
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
    if (currentPage?.type === 'board' || currentPage?.type === 'inline_board' || currentPage?.type === 'inline_linked_board') {
      return (
        <BoardPage
          page={memoizedCurrentPage}
          setPage={setPage}
          pagePermissions={currentPagePermissions}
        />
      );
    }
    else {
      return (
        // Document page is used in a few places, so it is responsible for retrieving its own permissions
        <DocumentPage
          page={memoizedCurrentPage}
          readOnly={readOnly}
          setPage={setPage}
          parentProposalId={parentProposalId}
        />
      );
    }
  }
  return null;
}
