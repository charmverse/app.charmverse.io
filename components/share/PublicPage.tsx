import { useTheme } from '@emotion/react';
import styled from '@emotion/styled';
import MoonIcon from '@mui/icons-material/DarkMode';
import EditIcon from '@mui/icons-material/Edit';
import SunIcon from '@mui/icons-material/WbSunny';
import { Box, Button, IconButton, Tooltip } from '@mui/material';
import type { Space } from '@prisma/client';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { validate } from 'uuid';

import charmClient from 'charmClient';
import { DatabasePage } from 'components/[pageId]/DatabasePage';
import DocumentPage from 'components/[pageId]/DocumentPage';
import { updateBoards } from 'components/common/BoardEditor/focalboard/src/store/boards';
import { addCard } from 'components/common/BoardEditor/focalboard/src/store/cards';
import { useAppDispatch } from 'components/common/BoardEditor/focalboard/src/store/hooks';
import { addView, setCurrent } from 'components/common/BoardEditor/focalboard/src/store/views';
import ErrorPage from 'components/common/errors/ErrorPage';
import LoadingComponent from 'components/common/LoadingComponent';
import { PageDialogProvider } from 'components/common/PageDialog/hooks/usePageDialog';
import PageDialogGlobalModal from 'components/common/PageDialog/PageDialogGlobal';
import Account from 'components/common/PageLayout/components/Account';
import CurrentPageFavicon from 'components/common/PageLayout/components/CurrentPageFavicon';
import { StyledToolbar } from 'components/common/PageLayout/components/Header';
import PageTitleWithBreadcrumbs from 'components/common/PageLayout/components/Header/components/PageTitleWithBreadcrumbs';
import PageContainer from 'components/common/PageLayout/components/PageContainer';
import { AppBar, HeaderSpacer } from 'components/common/PageLayout/PageLayout';
import { useColorMode } from 'context/darkMode';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { usePages } from 'hooks/usePages';
import { usePageTitle } from 'hooks/usePageTitle';
import { useSpaces } from 'hooks/useSpaces';
import type { PublicPageResponse } from 'lib/pages';
import { findParentOfType } from 'lib/pages/findParentOfType';

import PublicBountiesPage from './PublicBountiesPage';

const LayoutContainer = styled.div`
  display: flex;
  height: 100%;
`;

export default function PublicPage() {
  const theme = useTheme();
  const colorMode = useColorMode();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { pages, setCurrentPageId, getPagePermissions } = usePages();
  const [loadingSpace, setLoadingSpace] = useState(true);
  const currentSpace = useCurrentSpace();
  const { setSpaces } = useSpaces();
  const [, setTitleState] = usePageTitle();
  // keep track of the pageId by path since currentPageId may change when a page is viewed inside a modal
  const [basePageId, setBasePageId] = useState('');
  const [pageNotFound, setPageNotFound] = useState(false);
  const isBountiesPage = router.query.pageId?.[1] === 'bounties';

  const pagePermissions = getPagePermissions(basePageId);
  const userCanEdit = pagePermissions.edit_content;
  const hasShareInPath = router.asPath.split('/')[1] === 'share';
  const editString = router.asPath.replace('/share', '');
  async function onLoad(pageId: string | string[]) {
    const pageIdOrPath = pageId instanceof Array ? pageId.join('/') : (pageId as string);
    const spaceDomain = (router.query.pageId as string[])[0];

    let foundSpace: Space | null = null;
    let foundPage: PublicPageResponse | null = null;

    try {
      if (validate(router.query.pageId?.[0] || '')) {
        foundPage = await charmClient.getPublicPage(pageIdOrPath);
        foundSpace = foundPage.space;
        router.replace(`/share/${foundSpace?.domain}/${foundPage.page.path}`);
      }
      if (!foundPage) {
        foundSpace = await charmClient.getSpaceByDomain(spaceDomain);
        if (foundSpace) {
          setSpaces([foundSpace]);
        } else {
          setPageNotFound(true);
        }
      }
    } catch (err) {
      setPageNotFound(true);
    }

    if (!isBountiesPage && foundSpace) {
      try {
        if (!foundPage) {
          foundPage = await charmClient.getPublicPage(pageIdOrPath);
        }
        const { page: rootPage, cards, boards, space, views } = foundPage;

        charmClient.track.trackAction('page_view', {
          type: rootPage.type,
          pageId: rootPage.id,
          spaceId: rootPage.spaceId
        });

        setTitleState(rootPage.title);
        setCurrentPageId(rootPage.id);
        setBasePageId(rootPage.id);
        setSpaces([space]);

        dispatch(setCurrent(rootPage.id));
        cards.forEach((card) => {
          dispatch(addCard(card));
        });

        views.forEach((view) => {
          dispatch(addView(view));
        });

        dispatch(updateBoards(boards));
      } catch (err) {
        setPageNotFound(true);
      }
    }
    setLoadingSpace(false);
  }

  useEffect(() => {
    if (router.query.pageId) {
      onLoad(router.query.pageId);
    }

    return () => {
      setCurrentPageId('');
    };
  }, [router.query.pageId]);

  if (!router.query || loadingSpace) {
    return <LoadingComponent height='200px' isLoading={true} />;
  }

  if (isBountiesPage && !currentSpace) {
    return <ErrorPage message={"Sorry, that space doesn't exist"} />;
  }

  if (pageNotFound) {
    return <ErrorPage message={"Sorry, that page doesn't exist"} />;
  }

  const currentPage = pages[basePageId];

  const parentProposalId = findParentOfType({ pageId: basePageId, pageType: 'proposal', pageMap: pages });

  return (
    <>
      <Head>
        <CurrentPageFavicon />
      </Head>
      <LayoutContainer>
        <AppBar sidebarWidth={0} position='fixed' open={false}>
          <StyledToolbar variant='dense'>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 1,
                width: '100%'
              }}
            >
              <PageTitleWithBreadcrumbs pageId={basePageId} />
              <Box display='flex' alignItems='center'>
                {/** Link to editable page */}
                {userCanEdit && hasShareInPath && (
                  <Tooltip title='Edit' arrow placement='top'>
                    <Button href={editString} color='secondary' size='small' variant='text' sx={{ minWidth: 50 }}>
                      <EditIcon color='secondary' fontSize='small' />
                    </Button>
                  </Tooltip>
                )}
                {/** dark mode toggle */}
                <Tooltip title={theme.palette.mode === 'dark' ? 'Light mode' : 'Dark mode'} arrow placement='top'>
                  <IconButton sx={{ mx: 1 }} onClick={colorMode.toggleColorMode} color='inherit'>
                    {theme.palette.mode === 'dark' ? (
                      <SunIcon color='secondary' fontSize='small' />
                    ) : (
                      <MoonIcon color='secondary' fontSize='small' />
                    )}
                  </IconButton>
                </Tooltip>
                {/** user account */}
                <Account />
              </Box>
            </Box>
          </StyledToolbar>
        </AppBar>

        <PageDialogProvider>
          <PageContainer>
            <HeaderSpacer />

            {isBountiesPage ? (
              <PublicBountiesPage />
            ) : currentPage?.type.match(/board/) ? (
              <DatabasePage page={currentPage} setPage={() => {}} readOnly={true} />
            ) : (
              currentPage && (
                <DocumentPage
                  page={currentPage}
                  setPage={() => {}}
                  readOnly={true}
                  parentProposalId={parentProposalId}
                />
              )
            )}
            <PageDialogGlobalModal />
          </PageContainer>
        </PageDialogProvider>
      </LayoutContainer>
    </>
  );
}
