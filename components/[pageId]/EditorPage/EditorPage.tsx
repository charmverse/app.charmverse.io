import { Prisma, Page } from '@prisma/client';
import charmClient from 'charmClient';
import { Card } from 'components/common/BoardEditor/focalboard/src/blocks/card';
import { addBoard } from 'components/common/BoardEditor/focalboard/src/store/boards';
import { addCard } from 'components/common/BoardEditor/focalboard/src/store/cards';
import { useAppDispatch } from 'components/common/BoardEditor/focalboard/src/store/hooks';
import { setCurrent } from 'components/common/BoardEditor/focalboard/src/store/views';
import ErrorPage from 'components/common/errors/ErrorPage';
import { usePages } from 'hooks/usePages';
import { usePageTitle } from 'hooks/usePageTitle';
import { useUser } from 'hooks/useUser';
import { Board } from 'lib/focalboard/board';
import { IPagePermissionFlags } from 'lib/permissions/pages/page-permission-interfaces';
import debouncePromise from 'lib/utilities/debouncePromise';
import { isTruthy } from 'lib/utilities/types';
import log from 'loglevel';
import { useState, useMemo, useEffect, useCallback } from 'react';
import BoardPage from '../BoardPage';
import DocumentPage from '../DocumentPage';

export default function EditorPage (
  { shouldLoadPublicPage = true, pageId, currentPageId = pageId, publicShare = false, onPageLoad }:
  {shouldLoadPublicPage?: boolean, onPageLoad?: (pageId: string) => void, pageId: string, publicShare?: boolean, currentPageId?: string}
) {
  const dispatch = useAppDispatch();
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
    const { pages: publicPages, blocks } = await charmClient.getPublicPage(publicPageId);

    const rootPage = publicPages.find(page => page.id === publicPageId);
    if (rootPage) {
      setTitleState(rootPage?.title);
      onPageLoad?.(rootPage?.id);
    }
    const cardBlock = blocks.find(block => block.type === 'card');
    const boardBlock = blocks.find(block => block.type === 'board');

    if (cardBlock) {
      dispatch(setCurrent(cardBlock.id));
      dispatch(addCard(cardBlock as unknown as Card));
    }
    if (boardBlock) {
      dispatch(addBoard(boardBlock as unknown as Board));
    }
    setPages(publicPages.reduce((record, page) => ({ ...record, [page.id]: page }), {}));
  }

  const pagesLoaded = Object.keys(pages).length > 0;

  useEffect(() => {
    if (publicShare === true && pageId && shouldLoadPublicPage) {
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
