import type { Theme } from '@emotion/react';
import { css } from '@emotion/react';
import styled from '@emotion/styled';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import DeleteIcon from '@mui/icons-material/Delete';
import GroupAddOutlinedIcon from '@mui/icons-material/GroupAddOutlined';
import QuestionMarkIcon from '@mui/icons-material/QuestionMark';
import BountyIcon from '@mui/icons-material/RequestPageOutlined';
import SearchIcon from '@mui/icons-material/Search';
import SettingsIcon from '@mui/icons-material/Settings';
import TaskOutlinedIcon from '@mui/icons-material/TaskOutlined';
import { Divider, Tooltip } from '@mui/material';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import type { BoxProps } from '@mui/system';
import type { Page } from '@prisma/client';
import { usePopupState } from 'material-ui-popup-state/hooks';
import { useRouter } from 'next/router';
import { useCallback, useState } from 'react';

import Link from 'components/common/Link';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useCurrentSpacePermissions } from 'hooks/useCurrentSpacePermissions';
import useKeydownPress from 'hooks/useKeydownPress';
import { useWebSocketClient } from 'hooks/useSocketClient';
import { useUser } from 'hooks/useUser';
import type { NewPageInput } from 'lib/pages';
import { addPageAndRedirect } from 'lib/pages';
import type { LoggedInUser } from 'models';

import { headerHeight } from '../Header/Header';
import NewPageMenu from '../NewPageMenu';
import PageNavigation from '../PageNavigation';
import SearchInWorkspaceModal from '../SearchInWorkspaceModal';
import TrashModal from '../TrashModal';

import Workspaces from './Workspaces';

const WorkspaceLabel = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: relative;
  .add-a-page {
    display: flex;
    position: absolute;
    right: 8px;
    top: 0px;
  }
`;

const SidebarContainer = styled.div`
  display: flex;
  background-color: ${({ theme }) => theme.palette.sidebar.background};
  height: 100%;

  // disable hover UX on ios which converts first click to a hover event
  @media (pointer: fine) {

    .add-a-page {
      opacity: 0;
      transition: opacity 0.2s ease-in-out;
    }

    .sidebar-header .MuiIconButton-root {
      opacity: 0;
    }

    &:hover {
      .sidebar-header {
        .MuiTypography-root {
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .MuiIconButton-root {
          opacity: 1;
        }
      }
      .add-a-page {
        opacity: 1;
      }
    }
  }

`;

const sidebarItemStyles = ({ theme }: { theme: Theme }) => css`
  padding-left: ${theme.spacing(2)};
  padding-right: ${theme.spacing(2)};
  align-items: center;
  color: ${theme.palette.secondary.main};
  display: flex;
  font-size: 14px;
  font-weight: 500;
  padding-top: 4px;
  padding-bottom: 4px;
  &:hover {
    background-color: ${theme.palette.action.hover};
    color: inherit;
  }
  svg {
    font-size: 1.2em;
    margin-right: ${theme.spacing(1)};
  }
`;

const SectionName = styled(Typography)`
  padding-left: ${({ theme }) => theme.spacing(2)};
  padding-right: ${({ theme }) => theme.spacing(2)};
  color: ${({ theme }) => theme.palette.secondary.main};
  font-size: 11.5px;
  font-weight: 600;
  letter-spacing: 0.03em;
  margin-bottom: ${({ theme }) => theme.spacing(1)};
`;

const StyledSidebarLink = styled(Link, { shouldForwardProp: prop => prop !== 'active' })<{ active: boolean }>`
  ${sidebarItemStyles}
  ${({ active, theme }) => active ? `
    background-color: ${theme.palette.action.selected};
    color: ${theme.palette.text.primary};
  ` : ''}
`;

const StyledSidebarBox = styled(Box)`
  cursor: pointer;
  ${sidebarItemStyles}
`;

const SidebarHeader = styled.div(({ theme }) => `
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${theme.spacing(0, 1.5, 0, 2)};
  & .MuiIconButton-root {
    border-radius: 4px;
    transition: ${theme.transitions.create('opacity', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.enteringScreen
  })};
  }
  // necessary for content to be below app bar
  min-height: ${headerHeight}px;
`);

const ScrollingContainer = styled.div<{ isScrolled: boolean }>`
  flex-grow: 1;
  overflow-y: auto;
  transition: border-color 0.2s ease-out;
  border-top: 1px solid transparent;
  ${({ isScrolled, theme }) => isScrolled ? `border-top: 1px solid ${theme.palette.divider}` : ''};
`;

function SidebarLink ({ active, href, icon, label, target }: { active: boolean, href: string, icon: any, label: string, target?: string }) {
  return (
    <StyledSidebarLink href={href} active={active} target={target}>
      {icon}
      {label}
    </StyledSidebarLink>
  );
}

function SidebarBox ({ icon, label, ...props }: { icon: any, label: string } & BoxProps) {
  return (
    <StyledSidebarBox {...props}>
      {icon}
      {label}
    </StyledSidebarBox>
  );
}

interface SidebarProps {
  closeSidebar: () => void;
  favorites: LoggedInUser['favorites'];
}

export default function Sidebar ({ closeSidebar, favorites }: SidebarProps) {
  const router = useRouter();
  const { user } = useUser();
  const space = useCurrentSpace();
  const [userSpacePermissions] = useCurrentSpacePermissions();
  const [isScrolled, setIsScrolled] = useState(false);
  const [showingTrash, setShowingTrash] = useState(false);

  const searchInWorkspaceModalState = usePopupState({ variant: 'popover', popupId: 'search-in-workspace-modal' });
  const openSearchLabel = useKeydownPress(searchInWorkspaceModalState.toggle, { key: 'p', ctrl: true });

  const favoritePageIds = favorites.map(f => f.pageId);

  function onScroll (e: React.UIEvent<HTMLDivElement>) {
    setIsScrolled(e.currentTarget?.scrollTop > 0);
  }

  const addPage = useCallback((_page: Partial<Page>) => {
    if (user && space) {
      const newPage: NewPageInput = {
        ..._page,
        createdBy: user.id,
        spaceId: space.id
      };
      addPageAndRedirect(newPage, router)
        .then();
    }
  }, []);

  return (
    <SidebarContainer>
      <Workspaces />
      {space && (
        <Box display='flex' flexDirection='column' sx={{ height: '100%', flexGrow: 1, width: 'calc(100% - 57px)' }}>
          <SidebarHeader className='sidebar-header'>
            <Typography><strong data-test='sidebar-space-name'>{space.name}</strong></Typography>
            <IconButton onClick={closeSidebar} size='small'>
              <ChevronLeftIcon />
            </IconButton>
          </SidebarHeader>
          <Box mb={2}>
            { /** New navigation order: 1. Member Director, 2. Proposals, 3. Bounties */}
            <SidebarLink
              href={`/${space.domain}/members`}
              active={router.pathname.startsWith('/[domain]/members')}
              icon={<AccountCircleIcon fontSize='small' />}
              label='Member Directory'
            />
            <SidebarLink
              href={`/${space.domain}/proposals`}
              active={router.pathname.startsWith('/[domain]/proposals')}
              icon={<TaskOutlinedIcon fontSize='small' />}
              label='Proposals'
            />
            <SidebarLink
              href={`/${space.domain}/bounties`}
              active={router.pathname.startsWith('/[domain]/bounties')}
              icon={<BountyIcon fontSize='small' />}
              label='Bounties'
            />
            <Divider sx={{ mx: 2, my: 1 }} />
            <Tooltip title={<>Search and jump to a page <br />{openSearchLabel}</>} placement='right'>
              <div>
                <SidebarBox
                  onClick={searchInWorkspaceModalState.open}
                  icon={<SearchIcon color='secondary' fontSize='small' />}
                  label='Quick Find'
                />
              </div>
            </Tooltip>
            <SidebarLink
              active={router.pathname.startsWith('/[domain]/settings/invites')}
              href={`/${space.domain}/settings/invites`}
              icon={<GroupAddOutlinedIcon color='secondary' fontSize='small' />}
              label='Invite Members'
            />
            <SearchInWorkspaceModal
              isOpen={searchInWorkspaceModalState.isOpen}
              close={searchInWorkspaceModalState.close}
            />
            <SidebarLink
              active={router.pathname.startsWith('/[domain]/settings/workspace')}
              href={`/${space.domain}/settings/workspace`}
              icon={<SettingsIcon color='secondary' fontSize='small' />}
              label='Settings'
            />
            <SidebarLink
              active={false}
              href='https://discord.gg/ACYCzBGC2M'
              icon={<QuestionMarkIcon color='secondary' fontSize='small' />}
              label='Support & Feedback'
              target='_blank'
            />
          </Box>
          <ScrollingContainer isScrolled={isScrolled} onScroll={onScroll} className='page-navigation'>
            {favoritePageIds.length > 0 && (
              <Box mb={2}>
                <SectionName>
                  FAVORITES
                </SectionName>
                <PageNavigation
                  isFavorites={true}
                  rootPageIds={favoritePageIds}
                />
              </Box>
            )}
            <WorkspaceLabel>
              <SectionName>
                WORKSPACE
              </SectionName>
              {
                userSpacePermissions?.createPage && (
                  <div className='add-a-page'>
                    <NewPageMenu tooltip='Add a page' addPage={addPage} />
                  </div>
                )
              }

            </WorkspaceLabel>
            <Box mb={6}>
              <PageNavigation />
            </Box>
            <Box mb={2}>
              <SidebarBox
                onClick={() => {
                  setShowingTrash(true);
                }}
                icon={<DeleteIcon fontSize='small' />}
                label='Trash'
              />
            </Box>
          </ScrollingContainer>
        </Box>
      )}
      {showingTrash && (
        <TrashModal
          isOpen={showingTrash}
          onClose={() => {
            setShowingTrash(false);
          }}
        />
      )}
    </SidebarContainer>
  );
}
