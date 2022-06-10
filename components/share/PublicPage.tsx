import PageContainer from 'components/common/PageLayout/components/PageContainer';
import { AppBar } from 'components/common/PageLayout/PageLayout';
import styled from '@emotion/styled';
import { useRouter } from 'next/router';
import Head from 'next/head';
import CurrentPageFavicon from 'components/common/PageLayout/components/CurrentPageFavicon';
import Header from 'components/common/PageLayout/components/Header';
import charmClient from 'charmClient';
import { Card } from 'components/common/BoardEditor/focalboard/src/blocks/card';
import { addBoard } from 'components/common/BoardEditor/focalboard/src/store/boards';
import { addCard } from 'components/common/BoardEditor/focalboard/src/store/cards';
import { useAppDispatch } from 'components/common/BoardEditor/focalboard/src/store/hooks';
import { setCurrent } from 'components/common/BoardEditor/focalboard/src/store/views';
import ErrorPage from 'components/common/errors/ErrorPage';
import { usePages, PagesMap } from 'hooks/usePages';
import { usePageTitle } from 'hooks/usePageTitle';
import { Board } from 'lib/focalboard/board';
import debouncePromise from 'lib/utilities/debouncePromise';
import log from 'loglevel';
import { useCallback, useEffect, useMemo, useState } from 'react';
import BoardPage from 'components/[pageId]/BoardPage';
import DocumentPage from 'components/[pageId]/DocumentPage';

const LayoutContainer = styled.div`
  display: flex;
  height: 100%;
`;

export default function PublicPage () {

  const router = useRouter();
  const pageIdOrPath = router.query.pageId as string;
  const dispatch = useAppDispatch();
  const { pages, currentPageId, setCurrentPageId, setPages } = usePages();
  const [, setTitleState] = usePageTitle();
  const [pageNotFound, setPageNotFound] = useState(false);

  async function onLoad () {

    try {
      const { page: rootPage, pageBlock, boardBlock } = await charmClient.getPublicPage(pageIdOrPath);

      setTitleState(rootPage.title);
      setCurrentPageId(rootPage.id);

      if (pageBlock) {
        dispatch(setCurrent(pageBlock.id));
        dispatch(addCard(pageBlock as unknown as Card));
      }
      if (boardBlock) {
        dispatch(addBoard(boardBlock as unknown as Board));
      }

      if (rootPage.spaceId) {
        const publicPagesInSpace = await charmClient.getPages(rootPage.spaceId);
        const pageMap = publicPagesInSpace.reduce<PagesMap>((map, page) => {
          map[page.id] = page;
          return map;
        }, {});

        setPages(pageMap);
      }
      else {
        throw new Error('Pages with no spaceId not supported');
      }

    }
    catch (err) {
      setPageNotFound(true);
    }

  }

  useEffect(() => {
    onLoad();
  }, []);

  const currentPage = pages[currentPageId];

  if (pageNotFound) {
    return <ErrorPage message={'Sorry, that page doesn\'t exist'} />;
  }

  return (
    <>
      <Head>
        <CurrentPageFavicon />
      </Head>
      <LayoutContainer>

        <AppBar sidebarWidth={0} position='fixed' open={false}>
          <Header
            open={false}
            openSidebar={() => {}}
          />
        </AppBar>

        <PageContainer>
          {currentPage?.type === 'board'
            ? (
              <BoardPage page={currentPage} setPage={() => {}} readonly={true} />
            ) : (
              currentPage && <DocumentPage page={currentPage} setPage={() => {}} readOnly={true} />
            )}
        </PageContainer>

      </LayoutContainer>
    </>
  );
}
