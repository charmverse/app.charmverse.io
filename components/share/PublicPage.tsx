import { useTheme } from '@emotion/react';
import styled from '@emotion/styled';
import MoonIcon from '@mui/icons-material/DarkMode';
import SunIcon from '@mui/icons-material/WbSunny';
import { Box, IconButton, Tooltip } from '@mui/material';
import { useWeb3React } from '@web3-react/core';
import charmClient from 'charmClient';
import { Card } from 'components/common/BoardEditor/focalboard/src/blocks/card';
import { addBoard } from 'components/common/BoardEditor/focalboard/src/store/boards';
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
import PublicBountyList from './PublicBountyList';

const LayoutContainer = styled.div`
  display: flex;
  height: 100%;
`;

export default function PublicPage () {

  const { account } = useWeb3React();
  const [user, setUser] = useUser();

  const theme = useTheme();
  const colorMode = useColorMode();
  const router = useRouter();
  const pageIdOrPath = router.query.pageId instanceof Array ? router.query.pageId.join('/') : router.query.pageId as string;
  const dispatch = useAppDispatch();
  const { pages, currentPageId, setCurrentPageId } = usePages();
  const [currentSpace] = useCurrentSpace();
  const [, setSpaces] = useSpaces();
  const [, setTitleState] = usePageTitle();
  const [pageNotFound, setPageNotFound] = useState(false);
  const isBountiesPage = router.query.pageId?.[1] === 'bounties';

  async function onLoad () {

    if (isBountiesPage) {
      // The other part of this logic for setting current space is in hooks/useCurrentSpace
      const spaceDomain = (router.query.pageId as string[])[0];
      charmClient.getPublicSpaceInfo(spaceDomain).then(space => {
        setSpaces([space]);
      });
    }
    else {
      try {
        const { page: rootPage, pageBlock, boardBlock, space } = await charmClient.getPublicPage(pageIdOrPath);

        setTitleState(rootPage.title);
        setCurrentPageId(rootPage.id);
        setSpaces([space]);

        if (pageBlock) {
          dispatch(setCurrent(pageBlock.id));
          dispatch(addCard(pageBlock as unknown as Card));
        }
        if (boardBlock) {
          dispatch(addBoard(boardBlock as unknown as Board));
        }
      }
      catch (err) {
        setPageNotFound(true);
      }
    }
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

  const currentPage = pages[currentPageId];

  if (!router.query) {
    return <LoadingComponent height='200px' isLoading={true} />;
  }

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
                <Tooltip title={theme.palette.mode === 'dark' ? 'Light mode' : 'Dark mode'} arrow placement='bottom'>
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
            isBountiesPage && <PublicBountyList />
          }
          {
            !isBountiesPage && (currentPage?.type === 'board'
              ? (
                <BoardPage page={currentPage} setPage={() => {}} readonly={true} />
              ) : (
                currentPage && <DocumentPage page={currentPage} setPage={() => {}} readOnly={true} />
              ))
          }

        </PageContainer>

      </LayoutContainer>
    </>
  );
}
