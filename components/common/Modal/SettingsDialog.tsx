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

import Button from 'components/common/Button';
import { StyledTreeItem } from 'components/common/PageLayout/components/PageNavigation/components/PageTreeItem';
import { IntegrationSettings } from 'components/integrations/IntegrationsPage';
import TasksPage from 'components/nexus/TasksPage';
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

export function SpaceSettingsDialog() {
  const currentSpace = useCurrentSpace();

  const isMobile = useSmallScreen();
  const { activePath, onClose, onClick, open } = useSettingsDialog();

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
          {currentSpace && (
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
            {currentSpace && (
              <StyledTreeItem
                data-test={`space-settings-tab-${currentSpace.id}`}
                key={currentSpace.id}
                nodeId={currentSpace.name}
                label={
                  <Box display='flex' alignItems='center' gap={1}>
                    <WorkspaceAvatar name={currentSpace.name} image={currentSpace.spaceImage} />
                    <Typography noWrap>{currentSpace.name}</Typography>
                  </Box>
                }
              >
                {SETTINGS_TABS.map((tab) => (
                  <SpaceSettingsLink
                    data-test={`space-settings-tab-${currentSpace.id}-${tab.path}`}
                    key={tab.path}
                    label={tab.label}
                    icon={tab.icon}
                    onClick={() => onClick(`${currentSpace.name}-${tab.path}`)}
                    active={activePath === `${currentSpace.name}-${tab.path}`}
                  />
                ))}
              </StyledTreeItem>
            )}
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
          {currentSpace &&
            SETTINGS_TABS.map((tab) => (
              <TabPanel
                key={`${currentSpace.name}-${tab.path}`}
                value={activePath}
                index={`${currentSpace.name}-${tab.path}`}
              >
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
