import styled from '@emotion/styled';
import { Box } from '@mui/material';
import MuiAppBar from '@mui/material/AppBar';
import Head from 'next/head';
import { useRouter } from 'next/router';
import type { ReactNode } from 'react';

import Button from 'components/common/Button';
import { SpaceSettingsDialog } from 'components/common/Modal/SettingsDialog';
import { PageDialogProvider } from 'components/common/PageDialog/hooks/usePageDialog';
import PageDialogGlobalModal from 'components/common/PageDialog/PageDialogGlobal';
import { PageActionDisplayProvider } from 'hooks/usePageActionDisplay';
import { usePageIdFromPath } from 'hooks/usePageFromPath';
import { useSettingsDialog } from 'hooks/useSettingsDialog';
import { useUser } from 'hooks/useUser';
import { useWeb3AuthSig } from 'hooks/useWeb3AuthSig';

import CurrentPageFavicon from './components/CurrentPageFavicon';
import { Header, headerHeight } from './components/Header/Header';
import PageContainer from './components/PageContainer';
import SidebarSubmenu from './components/Sidebar/SidebarSubmenu';

export const AppBar = styled(MuiAppBar)`
  background: transparent;
  box-shadow: none;
  color: inherit;
  z-index: var(--z-index-appBar);
  flex-direction: row;
  justify-content: space-between;
`;

interface NexusLayoutProps {
  children: ReactNode;
}

function NexusLayout({ children }: NexusLayoutProps) {
  const { user, logoutUser, isLoaded } = useUser();
  const { disconnectWallet } = useWeb3AuthSig();
  const router = useRouter();
  const { onClick } = useSettingsDialog();

  async function logoutCurrentUser() {
    disconnectWallet();
    await logoutUser();
    router.push('/');
  }

  return (
    <Box display='flex' height='100%' data-test='space-page-layout'>
      <PageDialogProvider>
        <PageActionDisplayProvider>
          <AppBar position='fixed'>
            <Box display='flex'>
              {!!user && (
                <SidebarSubmenu
                  closeSidebar={() => undefined}
                  logoutCurrentUser={logoutCurrentUser}
                  openProfileModal={() => onClick('profile')}
                />
              )}
            </Box>
            <Box display='flex'>
              <Header open={true} openSidebar={() => undefined} />
              {!user && isLoaded && <Button sx={{ my: 1 }}>Join Charmverse</Button>}
            </Box>
          </AppBar>

          <PageContainer>
            <Box minHeight={`${headerHeight}px`} />
            {children}
            <SpaceSettingsDialog />
          </PageContainer>
          <PageDialogGlobalModal />
        </PageActionDisplayProvider>
      </PageDialogProvider>
    </Box>
  );
}

export default NexusLayout;
