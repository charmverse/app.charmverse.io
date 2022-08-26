import { useTheme } from '@emotion/react';
import styled from '@emotion/styled';
import MoonIcon from '@mui/icons-material/DarkMode';
import SunIcon from '@mui/icons-material/WbSunny';
import { Box, IconButton, Tooltip } from '@mui/material';
import { useWeb3React } from '@web3-react/core';
import charmClient from 'charmClient';
import { Card } from 'components/common/BoardEditor/focalboard/src/blocks/card';
import { updateBoards } from 'components/common/BoardEditor/focalboard/src/store/boards';
import { addCard } from 'components/common/BoardEditor/focalboard/src/store/cards';
import { useAppDispatch } from 'components/common/BoardEditor/focalboard/src/store/hooks';
import { setCurrent } from 'components/common/BoardEditor/focalboard/src/store/views';
import ErrorPage from 'components/common/errors/ErrorPage';
import LoadingComponent from 'components/common/LoadingComponent';
import Account from 'components/common/PageLayout/components/Account';
import CurrentPageFavicon from 'components/common/PageLayout/components/CurrentPageFavicon';
import { StyledToolbar } from 'components/common/PageLayout/components/Header';
import PageTitleWithBreadcrumbs from 'components/common/PageLayout/components/Header/components/PageTitleWithBreadcrumbs';
import PageContainer from 'components/common/PageLayout/components/PageContainer';
import { AppBar, HeaderSpacer } from 'components/common/PageLayout/PageLayout';
import BoardPage from 'components/[pageId]/BoardPage';
import DocumentPage from 'components/[pageId]/DocumentPage';
import { useColorMode } from 'context/darkMode';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { usePages } from 'hooks/usePages';
import { usePageTitle } from 'hooks/usePageTitle';
import { useSpaces } from 'hooks/useSpaces';
import { useUser } from 'hooks/useUser';
import { Board } from 'lib/focalboard/board';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import PublicBountiesPage from './PublicBountiesPage';

const LayoutContainer = styled.div`
  display: flex;
  height: 100%;
`;

export default function PublicPage () {

  const { account } = useWeb3React();
  const { setUser } = useUser();

  const theme = useTheme();
  const colorMode = useColorMode();
  const router = useRouter();
  const pageIdOrPath = router.query.pageId instanceof Array ? router.query.pageId.join('/') : router.query.pageId as string;
  const dispatch = useAppDispatch();
  const { pages, setCurrentPageId } = usePages();
  const [loadingSpace, setLoadingSpace] = useState(true);
  const [currentSpace] = useCurrentSpace();
  const [, setSpaces] = useSpaces();
  const [, setTitleState] = usePageTitle();
  // keep track of the pageId by path since currentPageId may change when a page is viewed inside a modal
  const [basePageId, setBasePageId] = useState('');
  const [pageNotFound, setPageNotFound] = useState(false);
  const isBountiesPage = router.query.pageId?.[1] === 'bounties';

  async function onLoad () {

    if (isBountiesPage) {
      // The other part of this logic for setting current space is in hooks/useCurrentSpace
      const spaceDomain = (router.query.pageId as string[])[0];
      try {
        const space = await charmClient.getPublicSpaceInfo(spaceDomain);
        setSpaces([space]);
      }
      catch (err) {
        setPageNotFound(true);
      }
    }
    else {
      try {
        const { page: rootPage, pageBlocks, boardBlocks, space } = await charmClient.getPublicPage(pageIdOrPath);

        setTitleState(rootPage.title);
        setCurrentPageId(rootPage.id);
        setBasePageId(rootPage.id);
        setSpaces([space]);

        if (pageBlocks.length !== 0) {
          dispatch(setCurrent(rootPage.id));
          pageBlocks.forEach(pageBlock => {
            dispatch(addCard(pageBlock as unknown as Card));
          });
        }

        boardBlocks.forEach(boardBlock => {
          dispatch(updateBoards([boardBlock as any as Board]));
        });
      }
      catch (err) {
        setPageNotFound(true);
      }
    }
    setLoadingSpace(false);
  }

  useEffect(() => {

    onLoad();

    return () => {
      setCurrentPageId('');
    };

  }, []);

  useEffect(() => {
    if (account) {
      charmClient.login(account)
        .then(loggedInUser => {
          setUser(loggedInUser);
        })
        .catch(() => {
          charmClient.createUser({ address: account })
            .then(loggedInUser => {
              setUser(loggedInUser);
            }).catch(() => {
              charmClient.logout();
              setUser(null);
            });
        });

    }
  }, [account]);

  if (!router.query || loadingSpace) {
    return <LoadingComponent height='200px' isLoading={true} />;
  }

  if (isBountiesPage && !currentSpace) {
    return <ErrorPage message={'Sorry, that space doesn\'t exist'} />;
  }

  if (pageNotFound) {
    return <ErrorPage message={'Sorry, that page doesn\'t exist'} />;
  }

  const currentPage = pages[basePageId];

  return (
    <>
      <Head>
        <CurrentPageFavicon />
      </Head>
      <LayoutContainer>

        <AppBar sidebarWidth={0} position='fixed' open={false}>

          <StyledToolbar variant='dense'>
            <Box sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 1,
              width: '100%'
            }}
            >
              <PageTitleWithBreadcrumbs />
              <Box display='flex' alignItems='center'>
                {/** dark mode toggle */}
                <Tooltip title={theme.palette.mode === 'dark' ? 'Light mode' : 'Dark mode'} arrow placement='top'>
                  <IconButton sx={{ mx: 1 }} onClick={colorMode.toggleColorMode} color='inherit'>
                    {theme.palette.mode === 'dark' ? <SunIcon color='secondary' /> : <MoonIcon color='secondary' />}
                  </IconButton>
                </Tooltip>
                {/** user account */}
                <Account />
              </Box>
            </Box>
          </StyledToolbar>
        </AppBar>

        <PageContainer>
          <HeaderSpacer />

          {
            isBountiesPage
              ? <PublicBountiesPage />
              : (currentPage?.type === 'board' || currentPage?.type === 'inline_board' || currentPage?.type === 'inline_linked_board'
                ? (
                  <BoardPage page={currentPage} setPage={() => {}} readOnly={true} />
                ) : (
                  currentPage && <DocumentPage page={currentPage} setPage={() => {}} readOnly={true} />
                )
              )
          }

        </PageContainer>

      </LayoutContainer>
    </>
  );
}
