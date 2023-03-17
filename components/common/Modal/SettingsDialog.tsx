import styled from '@emotion/styled';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import ArrowRightIcon from '@mui/icons-material/ArrowRight';
import CloseIcon from '@mui/icons-material/Close';
import MenuIcon from '@mui/icons-material/Menu';
import TreeView from '@mui/lab/TreeView';
import type { BoxProps } from '@mui/material/Box';
import Box from '@mui/material/Box';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import type { Space } from '@prisma/client';
import type { ReactNode } from 'react';
import { useEffect } from 'react';

import Button from 'components/common/Button';
import { StyledTreeItem } from 'components/common/PageLayout/components/PageNavigation/components/PageTreeItem';
import { IntegrationSettings } from 'components/integrations/IntegrationsPage';
import TasksPage from 'components/nexus/TasksPage';
import ProfileSettings from 'components/profile/ProfileSettings';
import { ApiSettings } from 'components/settings/api/Api';
import Invites from 'components/settings/invites/Invites';
import MemberSettings from 'components/settings/members/MemberSettings';
import type { SpaceSettingsTab, UserSettingsTab } from 'components/settings/pages';
import { SETTINGS_TABS, ACCOUNT_TABS } from 'components/settings/pages';
import { RoleSettings } from 'components/settings/roles/RoleSettings';
import SpaceSettings from 'components/settings/workspace/Space';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { CurrentSpaceProvider, useCurrentSpaceId } from 'hooks/useCurrentSpaceId';
import { useHasMemberLevel } from 'hooks/useHasMemberLevel';
import { useSmallScreen } from 'hooks/useMediaScreens';
import { MembersProvider } from 'hooks/useMembers';
import { useSettingsDialog } from 'hooks/useSettingsDialog';
import { useSpaceFromPath } from 'hooks/useSpaceFromPath';
import { useSpaces } from 'hooks/useSpaces';
import { useUser } from 'hooks/useUser';
import members from 'pages/api/spaces/[id]/members';

import { SectionName } from '../PageLayout/components/Sidebar/Sidebar';
import { SidebarLink } from '../PageLayout/components/Sidebar/SidebarButton';
import WorkspaceAvatar from '../PageLayout/components/Sidebar/WorkspaceAvatar';

const SpaceSettingsLink = styled(SidebarLink)`
  padding-left: 36px;
`;

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
  const { setCurrentSpaceId } = useCurrentSpaceId();
  const { memberSpaces } = useSpaces();
  const currentSpace = useCurrentSpace();

  const isMobile = useSmallScreen();
  const { activePath, onClose, onClick, open } = useSettingsDialog();

  // This is only ever used for setting the current space as the target space, on the initial popup of the dialog
  const spaceByPath = useSpaceFromPath();
  useEffect(() => {
    if (spaceByPath) {
      if (memberSpaces.some((s) => s.id === spaceByPath.id)) {
        setCurrentSpaceId(spaceByPath.id);
      } else if (open) {
        onClick('account');
      }
    }
  }, [spaceByPath]);
  return (
    <Dialog
      fullWidth
      maxWidth='lg'
      fullScreen={isMobile}
      PaperProps={{ sx: { height: { md: '90vh' }, borderRadius: (theme) => theme.spacing(1) } }}
      onClose={onClose}
      open={open}
    >
      <Box data-test-active-path={activePath} display='flex' flexDirection='row' flex='1' overflow='hidden'>
        <Box
          component='aside'
          width={{ xs: '100%', md: 300 }}
          minWidth={{ xs: '100%', md: 300 }}
          display={isMobile ? (open && !activePath && 'block') || 'none' : 'block'}
          borderRight='1px solid'
          borderColor='divider'
          overflow='auto'
          sx={{ backgroundColor: (theme) => theme.palette.sidebar.background }}
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
          {memberSpaces.length > 0 && (
            <Box mt={2} py={0.5}>
              <SectionName>Space settings</SectionName>
            </Box>
          )}
          <TreeView
            aria-label='Profile settings tree view'
            defaultCollapseIcon={<ArrowDropDownIcon fontSize='large' />}
            defaultExpandIcon={<ArrowRightIcon fontSize='large' />}
            defaultExpanded={currentSpace?.name ? [currentSpace?.name] : []}
            selected={activePath}
            sx={{
              '& .MuiTreeItem-content > .MuiTreeItem-label': { pl: 0.5 },
              '& .MuiTreeItem-content': { py: 0.5 },
              '& .MuiTreeItem-group .MuiTreeItem-content': { pl: 1 },
              '& .MuiTreeItem-root[aria-expanded] > .MuiTreeItem-content': { py: 1 }
            }}
          >
            {memberSpaces.map((space) => (
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
              >
                {SETTINGS_TABS.map((tab) => (
                  <SpaceSettingsLink
                    data-test={`space-settings-tab-${space.id}-${tab.path}`}
                    key={tab.path}
                    label={tab.label}
                    icon={tab.icon}
                    onClick={() => {
                      setCurrentSpaceId(space.id);
                      onClick(`${space.name}-${tab.path}`);
                    }}
                    active={activePath === `${space.name}-${tab.path}`}
                  />
                ))}
              </StyledTreeItem>
            ))}
          </TreeView>
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
              sx={{ backgroundColor: (theme) => theme.palette.background.paper }}
            >
              <IconButton aria-label='open settings dialog menu' onClick={() => onClick()}>
                <MenuIcon />
              </IconButton>
            </Box>
          )}
          {memberSpaces.map((space) =>
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
export function SpaceSettingsDialog() {
  return (
    <CurrentSpaceProvider>
      <MembersProvider>
        <SpaceSettingsModalComponent />
      </MembersProvider>
    </CurrentSpaceProvider>
  );
}
