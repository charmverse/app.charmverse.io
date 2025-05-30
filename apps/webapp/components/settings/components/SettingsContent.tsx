import CloseIcon from '@mui/icons-material/Close';
import MenuIcon from '@mui/icons-material/Menu';
import type { BoxProps } from '@mui/material/Box';
import Box from '@mui/material/Box';
import DialogContent from '@mui/material/DialogContent';
import IconButton from '@mui/material/IconButton';
import type { ReactNode, SyntheticEvent } from 'react';

import { Button } from 'components/common/Button';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useSmallScreen } from 'hooks/useMediaScreens';
import { type SettingsPath } from 'hooks/useSettingsDialog';

import { AccountSettings } from '../account/AccountSettings';
import { ApiSettings } from '../api/ApiSettings';
import type { SpaceSettingsTab } from '../config';
import { ACCOUNT_TABS, SPACE_SETTINGS_TABS } from '../config';
import { SpaceCredentialSettings } from '../credentials/SpaceCredentialSettings';
import { ImportSettings } from '../import/ImportSettings';
import { IntegrationSettings } from '../integrations/IntegrationSettings';
import { Invites } from '../invites/Invites';
import { NotificationSettings } from '../notifications/NotificationSettings';
import { ProjectsSettings } from '../projects/ProjectsSettings';
import { SpaceProposalSettings } from '../proposals/SpaceProposalSettings';
import { RoleSettings } from '../roles/RoleSettings';
import { SpaceSettings } from '../space/SpaceSettings';
import { useSpaceSubscription } from '../subscription/hooks/useSpaceSubscription';
import { SubscriptionSettings } from '../subscription/SubscriptionSettings';

import { SettingsMenu } from './SettingsMenu';

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
  credentials: SpaceCredentialSettings,
  integrations: IntegrationSettings,
  notifications: NotificationSettings
};

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  const spaceStyles = value === 'space' || value === 'notifications' ? { p: 0 } : undefined;

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

  const { isSpaceReadonly } = useSpaceSubscription();
  return (
    <Box data-test-active-path={activePath} display='flex' flexDirection='row' flex='1' overflow='hidden' height='100%'>
      <SettingsMenu activePath={activePath} onSelectPath={onSelectPath} />
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
              {tab.path === 'account' ? <AccountSettings /> : tab.path === 'projects' ? <ProjectsSettings /> : null}
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
      {!isSpaceReadonly && (
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
