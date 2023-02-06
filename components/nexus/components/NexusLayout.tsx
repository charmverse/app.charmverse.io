import MoonIcon from '@mui/icons-material/DarkMode';
import SunIcon from '@mui/icons-material/WbSunny';
import { IconButton, Tooltip } from '@mui/material';
import { Box, useTheme } from '@mui/system';
import type { ReactNode } from 'react';

import PageLayout from 'components/common/PageLayout';
import Account from 'components/common/PageLayout/components/Account';
import { StyledToolbar } from 'components/common/PageLayout/components/Header';
import { CenteredPageContent } from 'components/common/PageLayout/components/PageContent';
import { AppBar } from 'components/common/PageLayout/PageLayout';
import { useColorMode } from 'context/darkMode';
import { useUser } from 'hooks/useUser';

import NexusSidebar from './NexusSidebar';

const emptySidebar = () => <div></div>;

export default function NexusLayout(props: { children: ReactNode }) {
  // hide sidebar for public users for now, since they can't create a workspace
  const { user } = useUser();
  const theme = useTheme();
  const colorMode = useColorMode();

  return (
    <PageLayout sidebarWidth={user ? 55 : 0} sidebar={user ? NexusSidebar : emptySidebar}>
      {!user && (
        <AppBar sidebarWidth={0} position='fixed' open={false}>
          <StyledToolbar variant='dense'>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'flex-end',
                alignItems: 'center',
                gap: 1,
                width: '100%'
              }}
            >
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
      )}

      <CenteredPageContent>{props.children}</CenteredPageContent>
    </PageLayout>
  );
}
