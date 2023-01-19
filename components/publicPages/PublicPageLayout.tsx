import { useTheme } from '@emotion/react';
import styled from '@emotion/styled';
import MoonIcon from '@mui/icons-material/DarkMode';
import SunIcon from '@mui/icons-material/WbSunny';
import { Box, IconButton, Tooltip } from '@mui/material';
import Head from 'next/head';

import { PageDialogProvider } from 'components/common/PageDialog/hooks/usePageDialog';
import PageDialogGlobalModal from 'components/common/PageDialog/PageDialogGlobal';
import Account from 'components/common/PageLayout/components/Account';
import CurrentPageFavicon from 'components/common/PageLayout/components/CurrentPageFavicon';
import { StyledToolbar } from 'components/common/PageLayout/components/Header';
import PageTitleWithBreadcrumbs from 'components/common/PageLayout/components/Header/components/PageTitleWithBreadcrumbs';
import PageContainer from 'components/common/PageLayout/components/PageContainer';
import { AppBar, HeaderSpacer } from 'components/common/PageLayout/PageLayout';
import { useColorMode } from 'context/darkMode';

const LayoutContainer = styled.div`
  display: flex;
  height: 100%;
`;

type Props = {
  children: React.ReactNode;
  basePageId?: string;
};

export function PublicPageLayout({ children, basePageId }: Props) {
  const theme = useTheme();
  const colorMode = useColorMode();

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
            {children}
            <PageDialogGlobalModal />
          </PageContainer>
        </PageDialogProvider>
      </LayoutContainer>
    </>
  );
}
