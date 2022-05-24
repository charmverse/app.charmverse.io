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

interface Props {
  shouldLoadPublicPage?: boolean,
  onPageLoad?: (pageId: string) => void,
  pageId: string
}

export default function EditorPage (
  { shouldLoadPublicPage, pageId, onPageLoad }: Props

) {
  const dispatch = useAppDispatch();
  const { setIsEditing, pages, setPages, getPagePermissions } = usePages();
  const [, setTitleState] = usePageTitle();
  const [pageNotFound, setPageNotFound] = useState(false);
  const [user] = useUser();

  const currentPagePermissions = getPagePermissions(pageId);

  console.log('Current', currentPagePermissions, pageId);

  async function loadPublicPage (publicPageId: string) {

    try {
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
    catch (err) {
      setPageNotFound(true);
    }

  }

  const pagesLoaded = Object.keys(pages).length > 0;

  useEffect(() => {

    if (pageId && shouldLoadPublicPage) {
      loadPublicPage(pageId as string);
    }
    else if (pageId && pagesLoaded) {
      console.log('Entering here');
      const pageByPath = pages[pageId];
      if (pageByPath) {
        setTitleState(pageByPath.title);
        onPageLoad?.(pageByPath.id);
      }
      else {
        console.log('Pages not found');
        setPageNotFound(true);
      }
    }
  }, [pageId, pagesLoaded]);

  const debouncedPageUpdate = debouncePromise((updates: Prisma.PageUpdateInput) => {
    setIsEditing(true);
    setPages((_pages) => ({
      ..._pages,
      [pageId]: {
        ..._pages[pageId]!,
        ...updates as Partial<Page>
      }
    }));
    return charmClient.updatePage(updates);
  }, 500);

  const setPage = useCallback(async (updates: Partial<Page>) => {
    if (!pageId || shouldLoadPublicPage) {
      return;
    }
    if (updates.hasOwnProperty('title')) {
      setTitleState(updates.title || 'Untitled');
    }
    debouncedPageUpdate({ id: pageId, ...updates } as Prisma.PageUpdateInput)
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
    [pageId, currentPage?.headerImage, currentPage?.icon, currentPage?.title, currentPage?.deletedAt]
  );

  if (pageNotFound) {
    return <ErrorPage message={'Sorry, that page doesn\'t exist'} />;
  }
  // Handle public page
  else if (shouldLoadPublicPage === true && memoizedCurrentPage) {
    return currentPage?.type === 'board' ? (
      <BoardPage page={memoizedCurrentPage} setPage={setPage} readonly={true} />
    ) : (
      <DocumentPage page={memoizedCurrentPage} setPage={setPage} readOnly={true} />
    );
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
      return <BoardPage page={memoizedCurrentPage} setPage={setPage} readonly={currentPagePermissions.edit_content !== true} />;
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
