import { Prisma } from '@prisma/client';
import charmClient from 'charmClient';
import PageLayout from 'components/common/PageLayout';
import BoardPage from 'components/[pageId]/BoardPage';
import DocumentPage from 'components/[pageId]/DocumentPage';
import { usePages } from 'hooks/usePages';
import { usePageTitle } from 'hooks/usePageTitle';
import debouncePromise from 'lib/utilities/debouncePromise';
import { Page } from 'models';
import { useRouter } from 'next/router';
import { ReactElement, useEffect, useMemo, useState, useCallback, ReactNode } from 'react';
import ErrorPage from 'components/common/errors/ErrorPage';
import log from 'lib/log';
import { isTruthy } from 'lib/utilities/types';
import { IPagePermissionFlags } from 'lib/permissions/pages/page-permission-interfaces';
import { useUser } from 'hooks/useUser';
import { getCurrentViewCardsSortedFilteredAndGrouped } from 'components/common/BoardEditor/focalboard/src/store/cards';
import { useAppSelector } from 'components/common/BoardEditor/focalboard/src/store/hooks';

/**
 * @viewId - Enforce a specific view inside the nested blocks editor
 */
interface IBlocksEditorPage {
  publicShare?: boolean
}

export function EditorPage (
  { pageId, currentPageId = pageId, publicShare = false, onPageLoad }:
  {onPageLoad?: (pageId: string) => void, pageId: string, publicShare?: boolean, currentPageId?: string}
) {
  const { setIsEditing, pages, setPages, getPagePermissions } = usePages();
  const [, setTitleState] = usePageTitle();
  const [pageNotFound, setPageNotFound] = useState(false);
  const [user] = useUser();
  const [pagePermissions, setPagePermissions] = useState<Partial<IPagePermissionFlags> | null>(null);
  const debouncedPageUpdate = useMemo(() => {
    return debouncePromise((input: Prisma.PageUpdateInput) => {
      setIsEditing(true);
      return charmClient.updatePage(input);
    }, 500);
  }, []);

  async function loadPublicPage (publicPageId: string) {
    const publicPages = await charmClient.getPublicPage(publicPageId);
    const rootPage = publicPages.find(page => page.id === publicPageId);
    if (rootPage) {
      setTitleState(rootPage?.title);
      onPageLoad?.(rootPage?.id);
    }
    setPages(publicPages.reduce((record, page) => ({ ...record, [page.id]: page }), {}));
  }

  const pagesLoaded = Object.keys(pages).length > 0;

  useEffect(() => {
    if (publicShare === true && pageId) {
      loadPublicPage(pageId as string);
    }
    else if (pageId && pagesLoaded) {
      const pageByPath = pages[pageId] || Object.values(pages).filter(isTruthy).find(page => page.path === pageId);
      if (pageByPath) {
        setTitleState(pageByPath.title);
        onPageLoad?.(pageByPath.id);
      }
      else {
        setPageNotFound(true);
      }
    }
  }, [pageId, pagesLoaded]);

  const setPage = useCallback(async (updates: Partial<Page>) => {
    if (!currentPageId || publicShare === true) {
      return;
    }
    setPages((_pages) => ({
      ..._pages,
      [currentPageId]: {
        ..._pages[currentPageId]!,
        ...updates
      }
    }));
    if (updates.hasOwnProperty('title')) {
      setTitleState(updates.title || 'Untitled');
    }
    debouncedPageUpdate({ id: currentPageId, ...updates } as Prisma.PageUpdateInput)
      .catch((err: any) => {
        log.error('Error saving page', err);
      })
      .finally(() => {
        setIsEditing(false);
      });
  }, [currentPageId, publicShare]);

  // memoize the page to avoid re-rendering unless certain fields are changed
  const currentPage = pages[currentPageId];
  const memoizedCurrentPage = useMemo(
    () => pages[currentPageId],
    [currentPageId, currentPage?.headerImage, currentPage?.icon, currentPage?.title]
  );

  useEffect(() => {
    setPagePermissions(null);

    if (user && memoizedCurrentPage) {
      const permissions = getPagePermissions(memoizedCurrentPage.id);
      setPagePermissions(permissions);
    }
  }, [user, currentPageId]);

  if (pageNotFound) {
    return <ErrorPage message={'Sorry, that page doesn\'t exist'} />;
  }
  // Handle public page
  else if (publicShare === true && memoizedCurrentPage) {
    return currentPage?.type === 'board' ? (
      <BoardPage page={memoizedCurrentPage} setPage={setPage} readonly={true} />
    ) : (
      <DocumentPage page={memoizedCurrentPage} setPage={setPage} readOnly={true} />
    );
  }
  // Wait for permission load
  else if (!memoizedCurrentPage || !pagePermissions) {
    return null;
  }
  // Interpret page permission
  else if (pagePermissions.read === false) {
    return <ErrorPage message={'Sorry, you don\'t have access to this page'} />;
  }
  else if (pagePermissions.read === true) {
    if (currentPage?.type === 'board') {
      return <BoardPage page={memoizedCurrentPage} setPage={setPage} readonly={pagePermissions.edit_content !== true} />;
    }
    else {
      return (
        <DocumentPage
          page={memoizedCurrentPage}
          setPage={setPage}
          readOnly={pagePermissions.edit_content !== true}
        />
      );
    }
  }
  return null;
}

export default function BlocksEditorPage ({ publicShare = false }: IBlocksEditorPage) {
  const { currentPageId, setCurrentPageId } = usePages();
  const router = useRouter();
  const pageId = router.query.pageId as string;
  return <EditorPage currentPageId={currentPageId} onPageLoad={(_pageId) => setCurrentPageId(_pageId)} pageId={pageId} publicShare={publicShare} />;
}

BlocksEditorPage.getLayout = (page: ReactElement) => {
  return (
    <PageLayout>
      {page}
    </PageLayout>
  );
};
