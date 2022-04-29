
import styled from '@emotion/styled';
import { css, Theme } from '@emotion/react';
import AddIcon from '@mui/icons-material/Add';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import BountyIcon from '@mui/icons-material/RequestPage';
import SettingsIcon from '@mui/icons-material/Settings';
import QuestionMarkIcon from '@mui/icons-material/QuestionMark';
import NavigateNextIcon from '@mui/icons-material/ArrowRightAlt';
import Box from '@mui/material/Box';
import Button from 'components/common/Button';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import MuiLink from '@mui/material/Link';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { Page, Prisma } from '@prisma/client';
import charmClient from 'charmClient';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useSpaces } from 'hooks/useSpaces';
import { useUser } from 'hooks/useUser';
import { LoggedInUser } from 'models';
import NextLink from 'next/link';
import { useRouter } from 'next/router';
import { useState, useCallback } from 'react';
import CreateWorkspaceForm from 'components/common/CreateSpaceForm';
import Link from 'components/common/Link';
import { Modal } from 'components/common/Modal';
import NewPageMenu from 'components/common/PageLayout/components/NewPageMenu';
import WorkspaceAvatar from 'components/common/WorkspaceAvatar';
import { addPageAndRedirect, NewPageInput } from 'lib/pages';
import { headerHeight } from './Header';
import PageNavigation from './PageNavigation';

const AvatarLink = styled(NextLink)`
  cursor: pointer;
`;

const WorkspacesContainer = styled.div`
  float: left;
  height: 100%;
  border-right: 1px solid ${({ theme }) => theme.palette.divider};
  padding: ${({ theme }) => theme.spacing(1)};
`;

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

  .add-a-page {
    opacity: 0;
    transition: opacity 0.2s ease-in-out;
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
  }

  &:hover .add-a-page {
    opacity: 1;
  }
`;

const sidebarItemStyles = ({ theme }: { theme: Theme }) => css`
  padding-left: ${theme.spacing(2)};
  padding-right: ${theme.spacing(2)};
`;

const SectionName = styled(Typography)`
  ${sidebarItemStyles}
  color: ${({ theme }) => theme.palette.secondary.main};
  font-size: 11.5px;
  font-weight: 600;
  letter-spacing: 0.03em;
  margin-bottom: ${({ theme }) => theme.spacing(1)};
`;

const StyledSidebarLink = styled(Link)<{ active: boolean }>`
  ${sidebarItemStyles}
  align-items: center;
  color: ${({ theme }) => theme.palette.secondary.main};
  display: flex;
  font-size: 14px;
  font-weight: 500;
  padding-top: 4px;
  padding-bottom: 4px;
  :hover {
    background-color: ${({ theme }) => theme.palette.action.hover};
    color: inherit;
  }
  ${({ active, theme }) => active ? `
    background-color: ${theme.palette.action.selected};
    color: ${theme.palette.text.primary};
  ` : ''}
  svg {
    font-size: 1.2em;
    margin-right: ${({ theme }) => theme.spacing(1)};
  }
`;

const SidebarHeader = styled.div(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: theme.spacing(0, 1.5, 0, 2),
  '& .MuiIconButton-root': {
    opacity: 0,
    borderRadius: '4px',
    transition: theme.transitions.create('opacity', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen
    })
  },
  // necessary for content to be below app bar
  minHeight: headerHeight
}));

const ScrollingContainer = styled.div<{ isScrolled: boolean }>`
  flex-grow: 1;
  overflow-y: auto;
  transition: border-color 0.2s ease-out;
  border-top: 1px solid transparent;
  ${({ isScrolled, theme }) => isScrolled ? `border-top: 1px solid ${theme.palette.divider}` : ''};
`;

function SidebarLink ({ active, href, icon, label }: { active: boolean, href: string, icon: any, label: string }) {
  return (
    <StyledSidebarLink href={href} active={active}>
      {icon}
      {label}
    </StyledSidebarLink>
  );
}

interface SidebarProps {
  closeSidebar: () => void;
  favorites: LoggedInUser['favorites'];
}

export default function Sidebar ({ closeSidebar, favorites }: SidebarProps) {
  const router = useRouter();
  const [user, setUser] = useUser();
  const [space] = useCurrentSpace();
  const [spaces, setSpaces] = useSpaces();
  const [spaceFormOpen, setSpaceFormOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const favoritePageIds = favorites.map(f => f.pageId);

  const isAdmin = user?.spaceRoles.some(role => role.spaceId === space?.id && (role.isAdmin === true || role.role === 'admin'));

  function showSpaceForm () {
    setSpaceFormOpen(true);
  }

  function closeSpaceForm () {
    setSpaceFormOpen(false);
  }

  function onScroll (e: React.UIEvent<HTMLDivElement>) {
    setIsScrolled(e.currentTarget?.scrollTop > 0);
  }

  async function addSpace (spaceOpts: Prisma.SpaceCreateInput) {
    const newSpace = await charmClient.createSpace(spaceOpts);
    setSpaces([...spaces, newSpace]);
    // refresh user permissions
    const _user = await charmClient.getUser();
    setUser(_user);
    router.push(`/${newSpace.domain}`);
  }

  const addPage = useCallback((_page: Partial<Page>) => {
    if (user && space) {
      const newPage: NewPageInput = {
        ..._page,
        createdBy: user.id,
        spaceId: space.id
      };
      addPageAndRedirect(newPage, router);
    }
  }, []);

  return (
    <SidebarContainer>
      <WorkspacesContainer>
        <Grid container spacing={2} flexDirection='column'>
          {spaces.map(workspace => (
            <Grid item key={workspace.domain}>
              <AvatarLink href={`/${workspace.domain}`} passHref>
                <MuiLink>
                  <Tooltip title={workspace.name} placement='right' arrow>
                    <span>
                      <WorkspaceAvatar active={space?.domain === workspace.domain} name={workspace.name} />
                    </span>
                  </Tooltip>
                </MuiLink>
              </AvatarLink>
            </Grid>
          ))}
          <Grid item>
            <IconButton sx={{ borderRadius: '8px' }} onClick={showSpaceForm}><AddIcon /></IconButton>
          </Grid>
        </Grid>
        <Modal open={spaceFormOpen} onClose={closeSpaceForm}>
          <CreateWorkspaceForm onSubmit={addSpace} onCancel={closeSpaceForm} />
          <Typography variant='body2' align='center' sx={{ pt: 3 }}>
            <Button variant='text' href='/join' endIcon={<NavigateNextIcon />}>
              Join an existing workspace
            </Button>
          </Typography>
        </Modal>
      </WorkspacesContainer>
      {space && (
        <Box display='flex' flexDirection='column' sx={{ height: '100%', flexGrow: 1, width: 'calc(100% - 57px)' }}>
          <SidebarHeader className='sidebar-header'>
            <Typography><strong>{space.name}</strong></Typography>
            <IconButton onClick={closeSidebar} size='small'>
              <ChevronLeftIcon />
            </IconButton>
          </SidebarHeader>
          <Box mb={2}>
            {
              isAdmin && (
                <SidebarLink
                  active={router.pathname.startsWith('/[domain]/settings')}
                  href={`/${space.domain}/settings/workspace`}
                  icon={<SettingsIcon color='secondary' fontSize='small' />}
                  label='Settings & Members'
                />
              )
            }
            <SidebarLink
              active={router.pathname.startsWith('/[domain]/settings')}
              href='https://discord.com/channels/894960387743698944/945679068710469714'
              icon={<QuestionMarkIcon color='secondary' fontSize='small' />}
              label='Support & Feedback'
            />
          </Box>
          <ScrollingContainer isScrolled={isScrolled} onScroll={onScroll}>
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
              <div className='add-a-page'>
                <NewPageMenu tooltip='Add a page' addPage={addPage} />
              </div>
            </WorkspaceLabel>
            <Box mb={6}>
              <PageNavigation />
            </Box>
            <Box mb={2}>
              <SidebarLink
                href={`/${space.domain}/bounties`}
                active={router.pathname.startsWith('/[domain]/bounties')}
                icon={<BountyIcon fontSize='small' />}
                label='Bounties'
              />
            </Box>
          </ScrollingContainer>
        </Box>
      )}
    </SidebarContainer>
  );
}
