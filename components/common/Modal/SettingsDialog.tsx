import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import ArrowRightIcon from '@mui/icons-material/ArrowRight';
import CloseIcon from '@mui/icons-material/Close';
import MenuIcon from '@mui/icons-material/Menu';
import TreeView from '@mui/lab/TreeView';
import { Slide } from '@mui/material';
import type { BoxProps } from '@mui/material/Box';
import Box from '@mui/material/Box';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import type { Space } from '@prisma/client';
import { usePopupState } from 'material-ui-popup-state/hooks';
import type { ReactNode } from 'react';
import { useEffect } from 'react';

import { StyledTreeItem } from 'components/common/PageLayout/components/PageNavigation/components/PageTreeItem';
import IntegrationSettings from 'components/integrations/IntegrationsPage';
import TasksPage from 'components/nexus/TasksPage';
import ProfileSettings from 'components/profile/ProfileSettings';
import { ApiSettings } from 'components/settings/api/Api';
import Invites from 'components/settings/invites/Invites';
import MemberSettings from 'components/settings/members/MemberSettings';
import type { SpaceSettingsTab, UserSettingsTab } from 'components/settings/pages';
import { SETTINGS_TABS, ACCOUNT_TABS } from 'components/settings/pages';
import RoleSettings from 'components/settings/roles/RoleSettings';
import SpaceSettings from 'components/settings/workspace/Space';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { CurrentSpaceProvider, useCurrentSpaceId } from 'hooks/useCurrentSpaceId';
import { useSmallScreen } from 'hooks/useMediaScreens';
import { MembersProvider } from 'hooks/useMembers';
import { useSettingsDialog } from 'hooks/useSettingsDialog';
import { useSpaceFromPath } from 'hooks/useSpaceFromPath';
import { useSpaces } from 'hooks/useSpaces';
import { useUser } from 'hooks/useUser';

import WorkspaceAvatar from '../PageLayout/components/Sidebar/WorkspaceAvatar';

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
    return <MemberSettings space={space} />;
  }

  if (tab.path === SETTINGS_TABS[2].path && space) {
    return <RoleSettings space={space} />;
  }

  if (tab.path === SETTINGS_TABS[3].path && space) {
    return <Invites space={space} />;
  }

  if (tab.path === SETTINGS_TABS[4].path && space) {
    return <ApiSettings space={space} />;
  }

  if (tab.path === ACCOUNT_TABS[0].path) {
    return <IntegrationSettings />;
  }

  if (tab.path === ACCOUNT_TABS[1].path) {
    return <ProfileSettings />;
  }

  if (tab.path === ACCOUNT_TABS[2].path) {
    return <TasksPage />;
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

function SpaceSettingsModalComponent() {
  const { setCurrentSpaceId, currentSpaceId } = useCurrentSpaceId();

  // This is only ever used for setting the current space as the target space, on the initial popup of the dialog
  const spaceByPath = useSpaceFromPath();
  useEffect(() => {
    if (!currentSpaceId && spaceByPath) {
      setCurrentSpaceId(spaceByPath.id);
    }
  }, [spaceByPath]);

  const { user } = useUser();
  const { spaces } = useSpaces();
  const currentSpace = useCurrentSpace();

  const isMobile = useSmallScreen();
  const modalState = usePopupState({ variant: 'dialog', popupId: 'settings-dialog' });
  const { activePath, onClose, onClick } = useSettingsDialog();

  useEffect(() => {
    if (activePath) {
      modalState.open();
    } else {
      modalState.close();
    }
  }, [activePath]);

  return (
    <Dialog
      fullWidth
      maxWidth='lg'
      fullScreen={isMobile}
      PaperProps={{ sx: { height: { md: '90vh' }, borderRadius: (theme) => theme.spacing(1) } }}
      onClose={onClose}
      open={modalState.isOpen}
    >
      <Box display='flex' flexDirection='row' flex='1' overflow='hidden'>
        <Slide
          direction='right'
          in={isMobile ? modalState.isOpen && !activePath : true}
          appear={isMobile}
          unmountOnExit
        >
          <Box
            component='aside'
            maxWidth={{ xs: '100%', md: 350 }}
            minWidth={{ xs: '100%', md: 300 }}
            borderRight='1px solid'
            borderColor='divider'
            overflow='auto'
            sx={{ backgroundColor: (theme) => theme.palette.sidebar.background }}
          >
            <Typography p='10px' variant='body1'>
              {user?.username}
            </Typography>
            <TreeView
              aria-label='Profile settings tree view'
              defaultCollapseIcon={<ArrowDropDownIcon fontSize='large' />}
              defaultExpandIcon={<ArrowRightIcon fontSize='large' />}
              defaultExpanded={currentSpace?.name ? ['my-spaces', currentSpace?.name] : ['my-spaces']}
              sx={{
                '& .MuiTreeItem-content': { py: 0.5 },
                '& .MuiTreeItem-root[aria-expanded] > .MuiTreeItem-content': { py: 1 }
              }}
            >
              {ACCOUNT_TABS.map((tab) => (
                <StyledTreeItem
                  key={tab.path}
                  nodeId={tab.path}
                  label={tab.label}
                  icon={tab.icon}
                  onClick={() => onClick(tab.path)}
                  isActive={activePath === tab.path}
                />
              ))}
              <StyledTreeItem nodeId='my-spaces' label='My spaces' icon={null} sx={{ mt: 1.5 }}>
                {spaces.map((space) => (
                  <StyledTreeItem
                    data-test={`space-settings-tab-${space.id}`}
                    key={space.id}
                    onClick={() => {
                      setCurrentSpaceId(space.id);
                      onClick(`${space.name}-space`);
                    }}
                    nodeId={space.name}
                    label={
                      <Box display='flex' alignItems='center' gap={1}>
                        <WorkspaceAvatar name={space.name} image={space.spaceImage} />
                        <Typography noWrap>{space.name}</Typography>
                      </Box>
                    }
                    icon={null}
                  >
                    {SETTINGS_TABS.map((tab) => (
                      <StyledTreeItem
                        data-test={`space-settings-tab-${space.id}-${tab.path}`}
                        key={tab.path}
                        nodeId={`${space.name}-${tab.path}`}
                        label={tab.label}
                        icon={tab.icon}
                        onClick={() => {
                          setCurrentSpaceId(space.id);
                          onClick(`${space.name}-${tab.path}`);
                        }}
                        isActive={activePath === `${space.name}-${tab.path}`}
                        ContentProps={{ style: { paddingLeft: 45 } }}
                      />
                    ))}
                  </StyledTreeItem>
                ))}
              </StyledTreeItem>
            </TreeView>
          </Box>
        </Slide>
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
              sx={{ backgroundColor: (theme) => theme.palette.background.paper }}
            >
              <IconButton aria-label='open settings dialog menu' onClick={() => onClick()}>
                <MenuIcon />
              </IconButton>
            </Box>
          )}
          {spaces.map((space) =>
            SETTINGS_TABS.map((tab) => (
              <TabPanel key={`${space.name}-${tab.path}`} value={activePath} index={`${space.name}-${tab.path}`}>
                <TabView space={space} tab={tab} />
              </TabPanel>
            ))
          )}
          {ACCOUNT_TABS.map((tab) => (
            <TabPanel key={tab.path} value={activePath} index={tab.path}>
              <TabView tab={tab} />
            </TabPanel>
          ))}
        </Box>
        <IconButton
          aria-label='close the settings modal'
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: 15,
            top: 8,
            zIndex: 1
          }}
        >
          <CloseIcon color='secondary' fontSize='small' />
        </IconButton>
      </Box>
    </Dialog>
  );
}
export function SpaceSettingsDialog() {
  return (
    <CurrentSpaceProvider>
      <MembersProvider>
        <SpaceSettingsModalComponent />
      </MembersProvider>
    </CurrentSpaceProvider>
  );
}
