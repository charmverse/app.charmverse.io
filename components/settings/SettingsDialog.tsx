import type { Space } from '@charmverse/core/prisma';
import ChangeCircleIcon from '@mui/icons-material/ChangeCircle';
import CloseIcon from '@mui/icons-material/Close';
import MenuIcon from '@mui/icons-material/Menu';
import { Menu, MenuItem, Typography } from '@mui/material';
import type { BoxProps } from '@mui/material/Box';
import Box from '@mui/material/Box';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import IconButton from '@mui/material/IconButton';
import { bindMenu, bindTrigger, usePopupState } from 'material-ui-popup-state/hooks';
import type { ReactNode } from 'react';

import { Button } from 'components/common/Button';
import Link from 'components/common/Link';
import { SectionName } from 'components/common/PageLayout/components/Sidebar/Sidebar';
import { SidebarLink } from 'components/common/PageLayout/components/Sidebar/SidebarButton';
import { SubscriptionSettings } from 'components/settings/subscription/SubscriptionSettings';
import ProfileSettings from 'components/u/ProfileSettings';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useSmallScreen } from 'hooks/useMediaScreens';
import { useSettingsDialog } from 'hooks/useSettingsDialog';
import { useSpaces } from 'hooks/useSpaces';
import { getSpaceUrl } from 'lib/utilities/browser';

import { AccountSettings } from './account/AccountSettings';
import { ApiSettings } from './api/ApiSettings';
import type { SpaceSettingsTab, UserSettingsTab } from './config';
import { ACCOUNT_TABS, SETTINGS_TABS } from './config';
import { ImportSettings } from './import/ImportSettings';
import { Invites } from './invites/Invites';
import { RoleSettings } from './roles/RoleSettings';
import { SpaceSettings } from './space/SpaceSettings';
import { useBlockCount } from './subscription/hooks/useBlockCount';
import { useSpaceSubscription } from './subscription/hooks/useSpaceSubscription';
import { UpgradeChip } from './subscription/UpgradeWrapper';

interface TabPanelProps extends BoxProps {
  children?: ReactNode;
  index: string;
  value: string;
}

function TabView(props: { space: Space; tab: SpaceSettingsTab | UserSettingsTab }) {
  const { space, tab } = props;

  const settingsTab = SETTINGS_TABS.find((settingTab) => settingTab.path === tab.path);
  const accountsTab = ACCOUNT_TABS.find((accountTab) => accountTab.path === tab.path);

  if (!settingsTab && !accountsTab) {
    return null;
  }

  if (tab.path === 'space' && space) {
    return <SpaceSettings space={space} />;
  }

  if (tab.path === 'roles' && space) {
    return <RoleSettings space={space} />;
  }

  if (tab.path === 'invites' && space) {
    return <Invites space={space} />;
  }

  if (tab.path === 'import' && space) {
    return <ImportSettings space={space} />;
  }

  if (tab.path === 'api' && space) {
    return <ApiSettings space={space} />;
  }

  if (tab.path === 'subscription' && space) {
    return <SubscriptionSettings space={space} />;
  }

  if (tab.path === 'account') {
    return <AccountSettings />;
  }

  if (tab.path === 'profile') {
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
  const { space: currentSpace } = useCurrentSpace();
  const isMobile = useSmallScreen();
  const { activePath, onClose, onClick, open } = useSettingsDialog();
  const { memberSpaces } = useSpaces();
  const isSpaceSettingsVisible = !!memberSpaces.find((s) => s.name === currentSpace?.name);
  const { spaceSubscription, subscriptionEnded } = useSpaceSubscription();
  const { blockCount } = useBlockCount();
  const switchSpaceMenu = usePopupState({ variant: 'popover', popupId: 'switch-space' });

  const blockQuota = (spaceSubscription?.blockQuota || 0) * 1000;
  const passedBlockQuota = (blockCount?.count || 0) > blockQuota;

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
                section={tab.path}
              >
                {tab.path === 'subscription' && passedBlockQuota ? (
                  <UpgradeChip forceDisplay upgradeContext='upgrade' />
                ) : null}
              </SidebarLink>
            ))}
          {subscriptionEnded && memberSpaces.length > 1 && (
            <Box>
              <SidebarLink
                data-test='space-settings-tab-switch-space'
                label='Switch space'
                icon={<ChangeCircleIcon fontSize='small' />}
                {...bindTrigger(switchSpaceMenu)}
                active={false}
              />
              <Menu {...bindMenu(switchSpaceMenu)} sx={{ width: '100%' }}>
                {memberSpaces.map((_space) => (
                  <MenuItem
                    key={_space.id}
                    component={Link}
                    href={getSpaceUrl({ domain: _space.domain, customDomain: _space.customDomain })}
                  >
                    <Typography noWrap ml={1}>
                      {_space.name}
                    </Typography>
                  </MenuItem>
                ))}
              </Menu>
            </Box>
          )}
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
          {currentSpace &&
            ACCOUNT_TABS.map((tab) => (
              <TabPanel key={tab.path} value={activePath} index={tab.path}>
                <TabView tab={tab} space={currentSpace} />
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
