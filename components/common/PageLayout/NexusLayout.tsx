import styled from '@emotion/styled';
import { Box } from '@mui/material';
import MuiAppBar from '@mui/material/AppBar';
import { useRouter } from 'next/router';
import type { ReactNode } from 'react';

import Button from 'components/common/Button';
import { PageDialogProvider } from 'components/common/PageDialog/hooks/usePageDialog';
import { PageDialogGlobal } from 'components/common/PageDialog/PageDialogGlobal';
import { SpaceSettingsDialog } from 'components/settings/SettingsDialog';
import { PageActionDisplayProvider } from 'hooks/usePageActionDisplay';
import { useSettingsDialog } from 'hooks/useSettingsDialog';
import { useUser } from 'hooks/useUser';
import { useWeb3AuthSig } from 'hooks/useWeb3AuthSig';

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
  const { logoutWallet } = useWeb3AuthSig();
  const router = useRouter();
  const { onClick } = useSettingsDialog();

  async function logoutCurrentUser() {
    logoutWallet();
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
          <PageDialogGlobal />
        </PageActionDisplayProvider>
      </PageDialogProvider>
    </Box>
  );
}

export default NexusLayout;
