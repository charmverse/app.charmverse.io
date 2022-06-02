import { Page, Prisma } from '@prisma/client';
import charmClient from 'charmClient';
import { Card } from 'components/common/BoardEditor/focalboard/src/blocks/card';
import { addBoard } from 'components/common/BoardEditor/focalboard/src/store/boards';
import { addCard } from 'components/common/BoardEditor/focalboard/src/store/cards';
import { useAppDispatch } from 'components/common/BoardEditor/focalboard/src/store/hooks';
import { setCurrent } from 'components/common/BoardEditor/focalboard/src/store/views';
import ErrorPage from 'components/common/errors/ErrorPage';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { usePages } from 'hooks/usePages';
import { usePageTitle } from 'hooks/usePageTitle';
import { Board } from 'lib/focalboard/board';
import { IPageWithPermissions } from 'lib/pages';
import { fetchLinkedPages } from 'lib/pages/fetchLinkedPages';
import debouncePromise from 'lib/utilities/debouncePromise';
import log from 'loglevel';
import { useCallback, useEffect, useMemo, useState } from 'react';
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
  const [space] = useCurrentSpace();

  const currentPagePermissions = getPagePermissions(pageId);

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

      const foundPageContent: Record<string, Page> = publicPages.reduce((record, page) => ({ ...record, [page.id]: page }), {});

      const spaceId = foundPageContent[publicPageId]?.spaceId;

      if (spaceId) {
        const publicPagesInSpace = await charmClient.getPages(spaceId);
        const mapped = publicPagesInSpace.reduce((pageMap: Record<string, Page>, page) => {
          pageMap[page.id] = page;
          return pageMap;
        }, {});

        setPages({
          ...mapped,
          ...foundPageContent
        });
      }
      else {
        setPages(foundPageContent);
      }

      setPageNotFound(false);
      onPageLoad?.(publicPageId);
    }
    catch (err) {
      setPageNotFound(true);
    }

  }

  const pagesLoaded = Object.keys(pages).length > 0;

  useEffect(() => {
    async function main () {
      if (pageId && shouldLoadPublicPage) {
        loadPublicPage(pageId as string);
      }
      else if (pageId && pagesLoaded) {
        const pageByPath = pages[pageId];
        if (pageByPath) {
          setTitleState(pageByPath.title);
          onPageLoad?.(pageByPath.id);
        }
        else if (space) {
          // This might be an archived page
          const fetchedLinkedPages = await fetchLinkedPages(pageId, space.id);
          const fetchedPagesRecord: Record<string, IPageWithPermissions> = {};
          fetchedLinkedPages.forEach(linkedPage => {
            fetchedPagesRecord[linkedPage.id] = linkedPage;
          });

          setPages((_pages) => ({ ..._pages, ...fetchedPagesRecord }));
          setPageNotFound(false);
          onPageLoad?.(pageId);
        }
        else {
          setPageNotFound(true);
        }
      }
      else {
        setPageNotFound(true);
      }
    }

    main();
  }, [pageId, pagesLoaded, space]);

  const debouncedPageUpdate = debouncePromise(async (updates: Prisma.PageUpdateInput) => {
    setIsEditing(true);
    const updatedPage = await charmClient.updatePage(updates);
    setPages((_pages) => ({
      ..._pages,
      [pageId]: updatedPage
    }));
    return updatedPage;
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
