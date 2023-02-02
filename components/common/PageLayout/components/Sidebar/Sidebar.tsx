import styled from '@emotion/styled';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import GroupAddOutlinedIcon from '@mui/icons-material/GroupAddOutlined';
import MessageOutlinedIcon from '@mui/icons-material/MessageOutlined';
import QuestionMarkIcon from '@mui/icons-material/QuestionMark';
import BountyIcon from '@mui/icons-material/RequestPageOutlined';
import SearchIcon from '@mui/icons-material/Search';
import SettingsIcon from '@mui/icons-material/Settings';
import TaskOutlinedIcon from '@mui/icons-material/TaskOutlined';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import type { BoxProps } from '@mui/system';
import type { Page } from '@prisma/client';
import { usePopupState } from 'material-ui-popup-state/hooks';
import { useRouter } from 'next/router';
import type { MouseEvent, TouchEvent } from 'react';
import { useCallback, useMemo, useState } from 'react';

import SettingsDialog from 'components/common/Modal/SettingsDialog';
import { charmverseDiscordInvite } from 'config/constants';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useCurrentSpacePermissions } from 'hooks/useCurrentSpacePermissions';
import useKeydownPress from 'hooks/useKeydownPress';
import { useMobileSidebar } from 'hooks/useMobileSidebar';
import { useSettingsDialog } from 'hooks/useSettingsDialog';
import { useUser } from 'hooks/useUser';
import { useWeb3AuthSig } from 'hooks/useWeb3AuthSig';
import type { NewPageInput } from 'lib/pages';
import { addPageAndRedirect } from 'lib/pages';
import type { LoggedInUser } from 'models';

import NewPageMenu from '../NewPageMenu';
import PageNavigation from '../PageNavigation';
import SearchInWorkspaceModal from '../SearchInWorkspaceModal';
import TrashModal from '../TrashModal';

import { sidebarItemStyles, SidebarLink } from './SidebarBtn';
import SidebarSubmenu from './SidebarSubmenu';

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
  padding: 4px 0;
`;

const SidebarContainer = styled.div`
  display: flex;
  background-color: ${({ theme }) => theme.palette.sidebar.background};
  min-height: 100vh;

  ${({ theme }) => `
    ${theme.breakpoints.up('md')} {
      height: 100%;
    }
`}

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
        > .MuiButton-root {
          padding-right: ${({ theme }) => theme.spacing(5)};
        }
      }
      .add-a-page {
        opacity: 1;
      }
    }
  }
`;

const SectionName = styled(Typography)`
  padding-left: ${({ theme }) => theme.spacing(2)};
  padding-right: ${({ theme }) => theme.spacing(2)};
  color: ${({ theme }) => theme.palette.secondary.main};
  font-size: 11.5px;
  font-weight: 600;
  letter-spacing: 0.03em;
`;

const StyledSidebarBox = styled(Box)`
  cursor: pointer;
  ${sidebarItemStyles}
`;

const ScrollingContainer = styled.div<{ isScrolled: boolean }>`
  flex-grow: 1;
  overflow-y: auto;
  transition: border-color 0.2s ease-out;
  border-top: 1px solid transparent;
  ${({ isScrolled, theme }) => (isScrolled ? `border-top: 1px solid ${theme.palette.divider}` : '')};
`;

function SidebarBox({ icon, label, ...props }: { icon: any; label: string } & BoxProps) {
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
  navAction?: () => void;
}

export default function Sidebar({ closeSidebar, favorites, navAction }: SidebarProps) {
  const router = useRouter();
  const { user, logoutUser } = useUser();
  const space = useCurrentSpace();
  const [userSpacePermissions] = useCurrentSpacePermissions();
  const [isScrolled, setIsScrolled] = useState(false);
  const [showingTrash, setShowingTrash] = useState(false);
  const { disconnectWallet } = useWeb3AuthSig();
  const isMobileSidebar = useMobileSidebar();

  const { onClick, onTouchStart } = useSettingsDialog();
  const handleModalClick = (event: MouseEvent<Element, globalThis.MouseEvent>, path?: string) => {
    onClick(event, path);
    navAction?.();
  };
  const handleModalTouchStart = (event: TouchEvent<Element>, path?: string) => {
    onTouchStart(event, path);
    navAction?.();
  };
  const searchInWorkspaceModalState = usePopupState({ variant: 'popover', popupId: 'search-in-workspace-modal' });

  const openSearchLabel = useKeydownPress(searchInWorkspaceModalState.toggle, { key: 'p', ctrl: true });

  const favoritePageIds = favorites.map((f) => f.pageId);
  function onScroll(e: React.UIEvent<HTMLDivElement>) {
    setIsScrolled(e.currentTarget?.scrollTop > 0);
  }

  const addPage = useCallback(
    (_page: Partial<Page>) => {
      if (user && space) {
        const newPage: NewPageInput = {
          ..._page,
          createdBy: user.id,
          spaceId: space.id
        };

        addPageAndRedirect(newPage, router).then();
      }
    },
    [user?.id, space?.id]
  );

  async function logoutCurrentUser() {
    disconnectWallet();
    await logoutUser();
    router.push('/');
  }

  const pagesNavigation = useMemo(() => {
    return (
      <>
        {favoritePageIds.length > 0 && (
          <Box mb={2}>
            <SectionName mb={1}>FAVORITES</SectionName>
            <PageNavigation isFavorites={true} rootPageIds={favoritePageIds} />
          </Box>
        )}
        <WorkspaceLabel>
          <SectionName>SPACE</SectionName>
          {/** Test component */}
          {userSpacePermissions?.createPage && (
            <div className='add-a-page'>
              <NewPageMenu tooltip='Add a page' addPage={addPage} />
            </div>
          )}
        </WorkspaceLabel>
        <Box mb={6}>
          <PageNavigation onClick={navAction} />
        </Box>
        <Box mb={2}>
          <SidebarBox
            onClick={() => {
              setShowingTrash(true);
            }}
            icon={<DeleteOutlinedIcon fontSize='small' />}
            label='Trash'
          />
        </Box>
      </>
    );
  }, [favoritePageIds, userSpacePermissions, navAction, addPage]);

  return (
    <SidebarContainer>
      <Box display='flex' flexDirection='column' sx={{ height: '100%', flexGrow: 1, width: 'calc(100% - 57px)' }}>
        <SidebarSubmenu
          closeSidebar={closeSidebar}
          logoutCurrentUser={logoutCurrentUser}
          openProfileModal={(e) => handleModalClick(e, 'profile')}
        />
        {space && (
          <>
            <Box mb={2}>
              <SidebarLink
                href={`/${space.domain}/members`}
                active={router.pathname.startsWith('/[domain]/members')}
                icon={<AccountCircleIcon fontSize='small' />}
                label='Member Directory'
                onClick={navAction}
              />
              <SidebarLink
                href={`/${space.domain}/proposals`}
                active={router.pathname.startsWith('/[domain]/proposals')}
                icon={<TaskOutlinedIcon fontSize='small' />}
                label='Proposals'
                onClick={navAction}
              />
              <SidebarLink
                href={`/${space.domain}/bounties`}
                active={router.pathname.startsWith('/[domain]/bounties')}
                icon={<BountyIcon fontSize='small' />}
                label='Bounties'
                onClick={navAction}
              />
              <SidebarLink
                href={`/${space.domain}/forum`}
                active={router.pathname.startsWith('/[domain]/forum')}
                icon={<MessageOutlinedIcon fontSize='small' />}
                label='Forum'
                onClick={navAction}
              />
              <Divider sx={{ mx: 2, my: 1 }} />
              <Tooltip
                title={
                  <>
                    Search and jump to a page <br />
                    {openSearchLabel}
                  </>
                }
                placement='right'
              >
                <div>
                  <SidebarBox
                    onClick={(e) => {
                      searchInWorkspaceModalState.open(e);
                      navAction?.();
                    }}
                    icon={<SearchIcon color='secondary' fontSize='small' />}
                    label='Quick Find'
                  />
                </div>
              </Tooltip>
              <SearchInWorkspaceModal
                isOpen={searchInWorkspaceModalState.isOpen}
                close={searchInWorkspaceModalState.close}
              />
              <SidebarBox
                onClick={(e) => handleModalClick(e, `${space.name}-invites`)}
                onTouchStart={(e) => handleModalTouchStart(e, `${space.name}-invites`)}
                icon={<GroupAddOutlinedIcon color='secondary' fontSize='small' />}
                label='Invites'
              />
              <SidebarBox
                onClick={(e) => handleModalClick(e, `${space.name}-space`)}
                onTouchStart={(e) => handleModalTouchStart(e, `${space.name}-space`)}
                icon={<SettingsIcon color='secondary' fontSize='small' />}
                label='Settings'
              />
              <SidebarLink
                active={false}
                href={charmverseDiscordInvite}
                icon={<QuestionMarkIcon color='secondary' fontSize='small' />}
                label='Support & Feedback'
                target='_blank'
                onClick={navAction}
              />
            </Box>
            {isMobileSidebar ? (
              <div>{pagesNavigation}</div>
            ) : (
              <ScrollingContainer isScrolled={isScrolled} onScroll={onScroll} className='page-navigation'>
                {pagesNavigation}
              </ScrollingContainer>
            )}
          </>
        )}
      </Box>
      {showingTrash && (
        <TrashModal
          isOpen={showingTrash}
          onClose={() => {
            setShowingTrash(false);
          }}
        />
      )}
      <SettingsDialog />
    </SidebarContainer>
  );
}
