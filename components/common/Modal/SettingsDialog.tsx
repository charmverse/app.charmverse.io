import type { Space } from '@charmverse/core/prisma';
import CloseIcon from '@mui/icons-material/Close';
import MenuIcon from '@mui/icons-material/Menu';
import type { BoxProps } from '@mui/material/Box';
import Box from '@mui/material/Box';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import IconButton from '@mui/material/IconButton';
import type { ReactNode } from 'react';

import Button from 'components/common/Button';
import { IntegrationSettings } from 'components/integrations/IntegrationsPage';
import ProfileSettings from 'components/profile/ProfileSettings';
import { ApiSettings } from 'components/settings/api/Api';
import type { SpaceSettingsTab, UserSettingsTab } from 'components/settings/config';
import { SETTINGS_TABS, ACCOUNT_TABS } from 'components/settings/config';
import Invites from 'components/settings/invites/Invites';
import { RoleSettings } from 'components/settings/roles/RoleSettings';
import SpaceSettings from 'components/settings/workspace/Space';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useSmallScreen } from 'hooks/useMediaScreens';
import { useSettingsDialog } from 'hooks/useSettingsDialog';
import { useSpaces } from 'hooks/useSpaces';

import { SectionName } from '../PageLayout/components/Sidebar/Sidebar';
import { SidebarLink } from '../PageLayout/components/Sidebar/SidebarButton';

interface TabPanelProps extends BoxProps {
  children?: ReactNode;
  index: string;
  value: string;
}

function TabView(props: { space?: Space; tab: SpaceSettingsTab | UserSettingsTab }) {
  const { space, tab } = props;

  if (tab.path === SETTINGS_TABS[0].path && space) {
    return <SpaceSettings space={space} />;
  }

  if (tab.path === SETTINGS_TABS[1].path && space) {
    return <RoleSettings space={space} />;
  }

  if (tab.path === SETTINGS_TABS[2].path && space) {
    return <Invites space={space} />;
  }

  if (tab.path === SETTINGS_TABS[3].path && space) {
    return <ApiSettings space={space} />;
  }

  if (tab.path === ACCOUNT_TABS[0].path) {
    return <IntegrationSettings />;
  }

  if (tab.path === ACCOUNT_TABS[1].path) {
    return <ProfileSettings />;
  }

  return null;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <Box
      role='tabpanel'
      hidden={value !== index}
      id={`vertical-tabpanel-${index}`}
      aria-labelledby={`vertical-tab-${index}`}
      {...other}
    >
      {value === index && <DialogContent>{children}</DialogContent>}
    </Box>
  );
}

export function SpaceSettingsDialog() {
  const currentSpace = useCurrentSpace();

  const isMobile = useSmallScreen();
  const { activePath, onClose, onClick, open } = useSettingsDialog();
  const { memberSpaces } = useSpaces();
  const isSpaceSettingsVisible = !!memberSpaces.find((s) => s.name === currentSpace?.name);

  return (
    <Dialog
      fullWidth
      maxWidth='lg'
      fullScreen={isMobile}
      PaperProps={{
        sx: {
          maxHeight: 800,
          height: { md: '90vh' },
          background: (theme) =>
            theme.palette.mode === 'dark' ? 'var(--background-dark)' : 'var(--background-default)',
          borderRadius: (theme) => theme.spacing(1)
        }
      }}
      onClose={onClose}
      open={open}
    >
      <Box data-test-active-path={activePath} display='flex' flexDirection='row' flex='1' overflow='hidden'>
        <Box
          component='aside'
          width={{ xs: '100%', md: 300 }}
          minWidth={{ xs: '100%', md: 300 }}
          display={isMobile ? (open && !activePath && 'block') || 'none' : 'block'}
          overflow='auto'
          sx={{
            backgroundColor: (theme) => theme.palette.sidebar.background
          }}
        >
          <Box mt={2} py={0.5}>
            <SectionName>User settings</SectionName>
          </Box>
          {ACCOUNT_TABS.map((tab) => (
            <SidebarLink
              key={tab.path}
              label={tab.label}
              icon={tab.icon}
              onClick={() => onClick(tab.path)}
              active={activePath === tab.path}
            />
          ))}
          {currentSpace && isSpaceSettingsVisible && (
            <Box mt={2} py={0.5}>
              <SectionName>Space settings</SectionName>
            </Box>
          )}
          {currentSpace &&
            isSpaceSettingsVisible &&
            SETTINGS_TABS.map((tab) => (
              <SidebarLink
                data-test={`space-settings-tab-${tab.path}`}
                key={tab.path}
                label={tab.label}
                icon={tab.icon}
                onClick={() => onClick(tab.path)}
                active={activePath === tab.path}
              />
            ))}
        </Box>
        <Box flex='1 1 auto' position='relative' overflow='auto'>
          {isMobile && !!activePath && (
            <Box
              display='flex'
              justifyContent='space-between'
              px={2}
              pt={1}
              position={{ xs: 'sticky', md: 'absolute' }}
              top={0}
              right={0}
              zIndex={1}
              sx={{
                backgroundColor: (theme) =>
                  theme.palette.mode === 'dark' ? theme.palette.background.paper : theme.palette.background.dark
              }}
            >
              <IconButton aria-label='open settings dialog menu' onClick={() => onClick()}>
                <MenuIcon />
              </IconButton>
            </Box>
          )}
          {currentSpace &&
            SETTINGS_TABS.map((tab) => (
              <TabPanel key={tab.path} value={activePath} index={tab.path}>
                <TabView space={currentSpace} tab={tab} />
              </TabPanel>
            ))}
          {ACCOUNT_TABS.map((tab) => (
            <TabPanel key={tab.path} value={activePath} index={tab.path}>
              <TabView tab={tab} />
            </TabPanel>
          ))}
        </Box>
        {isMobile ? (
          <Button
            variant='text'
            color='inherit'
            onClick={onClose}
            sx={{
              position: 'absolute',
              right: 10,
              top: 5,
              zIndex: 1
            }}
          >
            Close
          </Button>
        ) : (
          <IconButton
            data-test='close-settings-modal'
            aria-label='close the settings modal'
            onClick={onClose}
            sx={{
              position: 'absolute',
              right: 15,
              top: 15,
              zIndex: 1
            }}
          >
            <CloseIcon color='secondary' fontSize='small' />
          </IconButton>
        )}
      </Box>
    </Dialog>
  );
}
