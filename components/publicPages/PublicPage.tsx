import { useTheme } from '@emotion/react';
import styled from '@emotion/styled';
import MoonIcon from '@mui/icons-material/DarkMode';
import SunIcon from '@mui/icons-material/WbSunny';
import { Box, IconButton, Tooltip } from '@mui/material';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

import charmClient from 'charmClient';
import { DatabasePage } from 'components/[pageId]/DatabasePage';
import DocumentPage from 'components/[pageId]/DocumentPage';
import { updateBoards } from 'components/common/BoardEditor/focalboard/src/store/boards';
import { addCard } from 'components/common/BoardEditor/focalboard/src/store/cards';
import { useAppDispatch } from 'components/common/BoardEditor/focalboard/src/store/hooks';
import { addView, setCurrent } from 'components/common/BoardEditor/focalboard/src/store/views';
import { PageDialogProvider } from 'components/common/PageDialog/hooks/usePageDialog';
import PageDialogGlobalModal from 'components/common/PageDialog/PageDialogGlobal';
import Account from 'components/common/PageLayout/components/Account';
import CurrentPageFavicon from 'components/common/PageLayout/components/CurrentPageFavicon';
import { StyledToolbar } from 'components/common/PageLayout/components/Header';
import PageTitleWithBreadcrumbs from 'components/common/PageLayout/components/Header/components/PageTitleWithBreadcrumbs';
import PageContainer from 'components/common/PageLayout/components/PageContainer';
import { AppBar, HeaderSpacer } from 'components/common/PageLayout/PageLayout';
import { useColorMode } from 'context/darkMode';
import { usePages } from 'hooks/usePages';
import { usePageTitle } from 'hooks/usePageTitle';
import type { PublicPageResponse } from 'lib/pages';
import { findParentOfType } from 'lib/pages/findParentOfType';

const LayoutContainer = styled.div`
  display: flex;
  height: 100%;
`;

type Props = {
  publicPage: PublicPageResponse;
};

export function PublicPage({ publicPage }: Props) {
  const theme = useTheme();
  const colorMode = useColorMode();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { setCurrentPageId, pages, setPublicSpaceId } = usePages();
  const [, setTitleState] = usePageTitle();
  // keep track of the pageId by path since currentPageId may change when a page is viewed inside a modal
  const [basePageId, setBasePageId] = useState('');

  async function onLoad() {
    const { page: rootPage, cards, boards, views, space } = publicPage;

    setPublicSpaceId(space.id);

    charmClient.track.trackAction('page_view', {
      type: rootPage.type,
      pageId: rootPage.id,
      spaceId: rootPage.spaceId
    });

    setTitleState(rootPage.title);
    setCurrentPageId(rootPage.id);
    setBasePageId(rootPage.id);

    dispatch(setCurrent(rootPage.id));
    cards.forEach((card) => {
      dispatch(addCard(card));
    });

    views.forEach((view) => {
      dispatch(addView(view));
    });

    dispatch(updateBoards(boards));
  }

  useEffect(() => {
    return () => setPublicSpaceId('');
  }, []);

  useEffect(() => {
    if (router.query.pageId) {
      onLoad();
    }

    return () => {
      setCurrentPageId('');
    };
  }, [router.query.pageId]);

  const currentPage = pages?.[basePageId];
  const parentProposalId = findParentOfType({ pageId: basePageId, pageType: 'proposal', pageMap: pages || {} });

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

            {currentPage?.type.match(/board/) ? (
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
