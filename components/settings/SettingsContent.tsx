import ChangeCircleIcon from '@mui/icons-material/ChangeCircle';
import CloseIcon from '@mui/icons-material/Close';
import MenuIcon from '@mui/icons-material/Menu';
import { Menu, MenuItem, Typography } from '@mui/material';
import type { BoxProps } from '@mui/material/Box';
import Box from '@mui/material/Box';
import DialogContent from '@mui/material/DialogContent';
import IconButton from '@mui/material/IconButton';
import { bindMenu, bindTrigger, usePopupState } from 'material-ui-popup-state/hooks';
import type { ReactNode, SyntheticEvent } from 'react';

import { Button } from 'components/common/Button';
import Link from 'components/common/Link';
import { SectionName } from 'components/common/PageLayout/components/Sidebar/components/SectionName';
import { SidebarLink } from 'components/common/PageLayout/components/Sidebar/components/SidebarButton';
import { useMemberProfileDialog } from 'components/members/hooks/useMemberProfileDialog';
import { CharmsSettings } from 'components/settings/charms/CharmsSettings';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useIsCharmverseSpace } from 'hooks/useIsCharmverseSpace';
import { useSmallScreen } from 'hooks/useMediaScreens';
import { useSettingsDialog, type SettingsPath } from 'hooks/useSettingsDialog';
import { useSpaceFeatures } from 'hooks/useSpaceFeatures';
import { useSpaces } from 'hooks/useSpaces';
import { useUser } from 'hooks/useUser';
import type { Feature } from 'lib/features/constants';
import { getSpaceUrl } from 'lib/utils/browser';

import { AccountSettings } from './account/AccountSettings';
import { ApiSettings } from './api/ApiSettings';
import type { SpaceSettingsTab } from './config';
import { ACCOUNT_TABS, SPACE_SETTINGS_TABS } from './config';
import { SpaceCredentialSettings } from './credentials/SpaceCredentialSettings';
import { ImportSettings } from './import/ImportSettings';
import { Invites } from './invites/Invites';
import { ProjectsSettings } from './projects/ProjectsSettings';
import { SpaceProposalSettings } from './proposals/SpaceProposalSettings';
import { RoleSettings } from './roles/RoleSettings';
import { SpaceSettings } from './space/SpaceSettings';
import { useSpaceSubscription } from './subscription/hooks/useSpaceSubscription';
import { SubscriptionSettings } from './subscription/SubscriptionSettings';
import { UpgradeChip } from './subscription/UpgradeWrapper';

type TabPanelProps = BoxProps & {
  children?: ReactNode;
  index: string;
  value: string;
};

const spaceTabs: Record<SpaceSettingsTab['path'], typeof SpaceSettings> = {
  api: ApiSettings,
  import: ImportSettings,
  invites: Invites,
  roles: RoleSettings,
  subscription: SubscriptionSettings,
  space: SpaceSettings,
  proposals: SpaceProposalSettings,
  credentials: SpaceCredentialSettings
};

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  const spaceStyles = value === 'space' ? { p: 0 } : undefined;

  return (
    <Box
      role='tabpanel'
      hidden={value !== index}
      id={`vertical-tabpanel-${index}`}
      aria-labelledby={`vertical-tab-${index}`}
      {...other}
    >
      {value === index && <DialogContent sx={{ overflowY: 'visible', ...spaceStyles }}>{children}</DialogContent>}
    </Box>
  );
}

type Props = {
  activePath?: SettingsPath;
  onClose: (e: SyntheticEvent) => void;
  onSelectPath: (path?: SettingsPath) => void;
  setUnsavedChanges: (dataChanged: boolean) => void;
};

export function SettingsContent({ activePath, onClose, onSelectPath, setUnsavedChanges }: Props) {
  const { space: currentSpace } = useCurrentSpace();
  const isMobile = useSmallScreen();
  const { memberSpaces } = useSpaces();
  const { mappedFeatures } = useSpaceFeatures();
  const { user } = useUser();
  const isSpaceSettingsVisible = !!memberSpaces.find((s) => s.name === currentSpace?.name);

  const { subscriptionEnded, hasPassedBlockQuota } = useSpaceSubscription();
  const switchSpaceMenu = usePopupState({ variant: 'popover', popupId: 'switch-space' });
  const { showUserProfile } = useMemberProfileDialog();
  const { onClose: closeSettingsDialog } = useSettingsDialog();
  const isCharmverseSpace = useIsCharmverseSpace();
  return (
    <Box data-test-active-path={activePath} display='flex' flexDirection='row' flex='1' overflow='hidden' height='100%'>
      <Box
        component='aside'
        width={{ xs: '100%', md: 300 }}
        minWidth={{ xs: '100%', md: 300 }}
        display={isMobile ? (!activePath && 'block') || 'none' : 'block'}
        overflow='auto'
        sx={{
          backgroundColor: (theme) => theme.palette.sidebar.background
        }}
      >
        <Box mt={2} py={0.5}>
          <SectionName>Account</SectionName>
        </Box>
        {ACCOUNT_TABS.filter((tab) => {
          if (!isCharmverseSpace && tab.path === 'projects') {
            return false;
          }
          return true;
        }).map((tab) => (
          <SidebarLink
            key={tab.path}
            data-test={`space-settings-tab-${tab.path}`}
            label={tab.label}
            icon={tab.icon}
            onClick={() => {
              if (user && tab.path === 'profile') {
                closeSettingsDialog();
                showUserProfile(user.id);
                return null;
              } else {
                onSelectPath(tab.path);
              }
            }}
            active={activePath === tab.path}
          />
        ))}
        {currentSpace && isSpaceSettingsVisible && (
          <Box mt={2} py={0.5}>
            <SectionName>Space</SectionName>
          </Box>
        )}
        {currentSpace &&
          isSpaceSettingsVisible &&
          SPACE_SETTINGS_TABS.map((tab) => (
            <SidebarLink
              data-test={`space-settings-tab-${tab.path}`}
              key={tab.path}
              label={mappedFeatures[tab.path as Feature]?.title || tab.label}
              icon={tab.icon}
              onClick={() => onSelectPath(tab.path)}
              active={activePath === tab.path}
              section={tab.path}
            >
              {tab.path === 'subscription' && hasPassedBlockQuota && currentSpace.paidTier !== 'enterprise' ? (
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
            <IconButton aria-label='open settings dialog menu' onClick={() => onSelectPath()}>
              <MenuIcon />
            </IconButton>
          </Box>
        )}
        {ACCOUNT_TABS.map((tab) => {
          return (
            <TabPanel key={tab.path} value={activePath ?? ''} index={tab.path}>
              {tab.path === 'account' ? (
                <AccountSettings />
              ) : tab.path === 'charms' ? (
                <CharmsSettings />
              ) : tab.path === 'projects' ? (
                <ProjectsSettings />
              ) : null}
            </TabPanel>
          );
        })}
        {SPACE_SETTINGS_TABS.map((tab) => {
          const TabView = spaceTabs[tab.path];
          return (
            <TabPanel key={tab.path} value={activePath ?? ''} index={tab.path}>
              {currentSpace && <TabView space={currentSpace} setUnsavedChanges={setUnsavedChanges} />}
            </TabPanel>
          );
        })}
      </Box>
      {!subscriptionEnded && (
        <Box>
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
      )}
    </Box>
  );
}
