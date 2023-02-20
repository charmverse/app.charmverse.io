import type { Page } from '@prisma/client';
import log from 'loglevel';
import { useCallback, useEffect, useState } from 'react';

import charmClient from 'charmClient';
import ErrorPage from 'components/common/errors/ErrorPage';
import { useCharmEditor } from 'hooks/useCharmEditor';
import { useCurrentPage } from 'hooks/useCurrentPage';
import { useCurrentSpaceId } from 'hooks/useCurrentSpaceId';
import { usePagePermissions } from 'hooks/usePagePermissions';
import { usePages } from 'hooks/usePages';
import { usePageTitle } from 'hooks/usePageTitle';
import type { PageMeta, PageUpdates } from 'lib/pages';
import { findParentOfType } from 'lib/pages/findParentOfType';
import debouncePromise from 'lib/utilities/debouncePromise';

import { DatabasePage } from '../DatabasePage';
import DocumentPage from '../DocumentPage';

export default function EditorPage({ pageId: pageIdOrPath }: { pageId: string }) {
  const { currentPageId, setCurrentPageId } = useCurrentPage();
  const { pages, loadingPages, updatePage } = usePages();
  const { editMode, resetPageProps, setPageProps } = useCharmEditor();
  const [, setTitleState] = usePageTitle();
  const [pageNotFound, setPageNotFound] = useState(false);
  const { currentSpaceId } = useCurrentSpaceId();
  const [isAccessDenied, setIsAccessDenied] = useState(false);
  const [currentPage, setCurrentPage] = useState<PageMeta | null>(null);
  const { permissions: pagePermissions } = usePagePermissions({ pageIdOrPath: currentPageId });

  const readOnly = (pagePermissions?.edit_content === false && editMode !== 'suggesting') || editMode === 'viewing';
  const parentProposalId = findParentOfType({ pageId: currentPageId, pageType: 'proposal', pageMap: pages });
  useEffect(() => {
    const pageFromContext = Object.values(pages).find(
      (page) => page?.id === pageIdOrPath || page?.path === pageIdOrPath
    );
    if (pageFromContext) {
      setPageNotFound(false);
      setCurrentPage(pageFromContext);
      setCurrentPageId(pageFromContext.id);
    } else if (!loadingPages && currentSpaceId) {
      // if the page is not in context, fetch it
      charmClient.pages
        .getPage(pageIdOrPath, currentSpaceId)
        .then((page) => {
          setPageNotFound(false);
          setCurrentPage(page);
          setCurrentPageId(page.id);
        })
        .catch((err) => {
          log.error(err);
          // An error will be thrown if page doesn't exist or if you dont have read permission for the page
          if (err.errorType === 'Access denied') {
            setIsAccessDenied(true);
          } else {
            // If the page doesn't exist an error will be thrown
            setPageNotFound(true);
          }
        });
    }
    return () => {
      setCurrentPageId('');
    };
  }, [pageIdOrPath, pages, currentSpaceId, loadingPages]);

  // set page attributes of the primary charm editor
  useEffect(() => {
    if (loadingPages || !pagePermissions) {
      // wait for pages loaded for permissions to be correct
      return;
    }
    if (!editMode) {
      if (pagePermissions.edit_content) {
        setPageProps({ permissions: pagePermissions, editMode: 'editing' });
      } else {
        setPageProps({ permissions: pagePermissions, editMode: 'viewing' });
      }
    } else {
      // pass editMode thru to fix hot-reloading which resets the prop
      setPageProps({ permissions: pagePermissions, editMode });
    }
    return () => {
      resetPageProps();
    };
  }, [pagePermissions, currentPage, loadingPages]);

  const debouncedPageUpdate = debouncePromise(async (updates: PageUpdates) => {
    setPageProps({ isSaving: true });
    const updatedPage = await updatePage(updates);
    return updatedPage;
  }, 500);

  const setPage = useCallback(
    async (updates: Partial<Page>) => {
      if (!currentPage) {
        return;
      }
      if (updates.hasOwnProperty('title')) {
        setTitleState(updates.title || 'Untitled');
      }
      debouncedPageUpdate({ id: currentPage.id, ...updates } as Partial<Page>)
        .catch((err: any) => {
          log.error('Error saving page', err);
        })
        .finally(() => {
          setPageProps({ isSaving: false });
        });
    },
    [currentPage]
  );

  if (isAccessDenied) {
    return <ErrorPage message={"Sorry, you don't have access to this page"} />;
  } else if (pageNotFound) {
    return <ErrorPage message={"Sorry, that page doesn't exist"} />;
  }
  // Wait for permission load
  else if (!currentPage || !pagePermissions) {
    return null;
  }
  // Interpret page permission
  else if (pagePermissions.read === false) {
    return <ErrorPage message={"Sorry, you don't have access to this page"} />;
  } else if (pagePermissions.read === true) {
    if (
      currentPage?.type === 'board' ||
      currentPage?.type === 'inline_board' ||
      currentPage?.type === 'inline_linked_board' ||
      currentPage?.type === 'linked_board'
    ) {
      return <DatabasePage page={currentPage} setPage={setPage} pagePermissions={pagePermissions} />;
    } else {
      return (
        // Document page is used in a few places, so it is responsible for retrieving its own permissions
        <DocumentPage page={currentPage} readOnly={readOnly} setPage={setPage} parentProposalId={parentProposalId} />
      );
    }
  }
  return null;
}
