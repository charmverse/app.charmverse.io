import type { Page } from '@prisma/client';
import log from 'loglevel';
import { useCallback, useEffect, useState } from 'react';
import useSWR from 'swr';

import charmClient from 'charmClient';
import ErrorPage from 'components/common/errors/ErrorPage';
import { useCharmEditor } from 'hooks/useCharmEditor';
import { useCurrentPage } from 'hooks/useCurrentPage';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { usePagePermissions } from 'hooks/usePagePermissions';
import { usePages } from 'hooks/usePages';
import { usePageTitle } from 'hooks/usePageTitle';
import type { PageMeta, PageUpdates } from 'lib/pages';
import debouncePromise from 'lib/utilities/debouncePromise';

import { DatabasePage } from '../DatabasePage';
import DocumentPage from '../DocumentPage';

export function EditorPage({ pageId: pageIdOrPath }: { pageId: string }) {
  const { currentPageId, setCurrentPageId } = useCurrentPage();
  const { pages, updatePage } = usePages();
  const { editMode, resetPageProps, setPageProps } = useCharmEditor();
  const [, setTitleState] = usePageTitle();
  const [pageNotFound, setPageNotFound] = useState(false);
  const currentSpace = useCurrentSpace();
  const [isAccessDenied, setIsAccessDenied] = useState(false);
  const [currentPage, setCurrentPage] = useState<PageMeta | null>(null);
  const { permissions: pagePermissions } = usePagePermissions({ pageIdOrPath: currentPageId });
  const { data: pageWithContent, error: pageWithContentError } = useSWR(
    currentSpace && `page-with-content-${currentPageId}`,
    () => charmClient.pages.getPage(pageIdOrPath, currentSpace!.id)
  );

  const readOnly = (pagePermissions?.edit_content === false && editMode !== 'suggesting') || editMode === 'viewing';
  useEffect(() => {
    const pageFromContext = pages[pageIdOrPath] || Object.values(pages).find((page) => page?.path === pageIdOrPath);
    if (pageFromContext && pageFromContext.id !== currentPageId) {
      setPageNotFound(false);
      setCurrentPage(pageFromContext);
      setCurrentPageId(pageFromContext.id);
    } else if (pageWithContent && pageWithContent.id !== currentPageId) {
      setPageNotFound(false);
      setCurrentPage(pageWithContent);
      setCurrentPageId(pageWithContent.id);
    } else if (pageWithContentError) {
      // An error will be thrown if page doesn't exist or if you dont have read permission for the page
      if (pageWithContentError.errorType === 'Access denied') {
        setIsAccessDenied(true);
      } else {
        // If the page doesn't exist an error will be thrown
        setPageNotFound(true);
      }
    }
  }, [pageIdOrPath, pages, currentPageId, pageWithContent, pageWithContentError]);

  // reset page id on unmount
  useEffect(() => {
    return () => {
      setCurrentPageId('');
    };
  }, []);
  // set page attributes of the primary charm editor
  useEffect(() => {
    if (!currentPageId || !pagePermissions) {
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
  }, [currentPageId, pagePermissions]);

  const savePage = useCallback(
    debouncePromise(async (updates: Partial<Page>) => {
      if (!currentPage) {
        return;
      }
      if (updates.hasOwnProperty('title')) {
        setTitleState(updates.title || 'Untitled');
      }
      setPageProps({ isSaving: true });
      updatePage({ id: currentPage.id, ...updates })
        .catch((err: any) => {
          log.error('Error saving page', err);
        })
        .finally(() => {
          setPageProps({ isSaving: false });
        });
    }, 500),
    [currentPage]
  );

  useEffect(() => {
    setTitleState(currentPage?.title || 'Untitled');
  }, [currentPage?.title]);

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
      currentPage.type === 'board' ||
      currentPage.type === 'inline_board' ||
      currentPage.type === 'inline_linked_board' ||
      currentPage.type === 'linked_board'
    ) {
      return <DatabasePage page={currentPage} setPage={savePage} pagePermissions={pagePermissions} />;
    } else {
      return (
        // Document page is used in a few places, so it is responsible for retrieving its own permissions
        <DocumentPage page={currentPage} readOnly={readOnly} setPage={savePage} />
      );
    }
  }
  return null;
}
