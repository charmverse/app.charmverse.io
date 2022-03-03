
import styled from '@emotion/styled';
import AddIcon from '@mui/icons-material/Add';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import BountyIcon from '@mui/icons-material/RequestPage';
import SettingsIcon from '@mui/icons-material/Settings';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import MuiLink from '@mui/material/Link';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { Prisma } from '@prisma/client';
import charmClient from 'charmClient';
import mutator from 'components/databases/focalboard/src//mutator';
import { getSortedBoards } from 'components/databases/focalboard/src/store/boards';
import { useAppSelector } from 'components/databases/focalboard/src/store/hooks';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { usePages } from 'hooks/usePages';
import { useSpaces } from 'hooks/useSpaces';
import { useUser } from 'hooks/useUser';
import getDisplayName from 'lib/users/getDisplayName';
import { LoggedInUser } from 'models';
import NextLink from 'next/link';
import { useRouter } from 'next/router';
import { useState } from 'react';
import { useIntl } from 'react-intl';
import { greyColor2 } from 'theme/colors';
import { untitledPage } from 'seedData';
import Avatar from '../Avatar';
import CreateWorkspaceForm from '../CreateSpaceForm';
import Link from '../Link';
import { Modal } from '../Modal';
import NewPageMenu from '../NewPageMenu';
import WorkspaceAvatar from '../WorkspaceAvatar';
import { headerHeight } from './Header';
import PageNavigation, { PageLink, StyledTreeItem } from './PageNavigation';

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
  &:hover .add-a-page {
    opacity: 1;
  }
`;

const SectionName = styled(Typography)`
  color: ${greyColor2};
  font-size: 12px;
  letter-spacing: 0.03em;
  font-weight: 600;
  padding-left: ${({ theme }) => theme.spacing(2)};
  padding-right: ${({ theme }) => theme.spacing(2)};
  margin-bottom: ${({ theme }) => theme.spacing(0.5)};
`;

const SidebarHeader = styled.div(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: theme.spacing(0, 2),
  '& .MuiIconButton-root': {
    opacity: 0,
    transition: theme.transitions.create('opacity', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen
    })
  },
  '&:hover .MuiIconButton-root': {
    opacity: 1
  },
  // necessary for content to be below app bar
  minHeight: headerHeight
}));

interface SidebarProps {
  closeSidebar: () => void;
  favorites: LoggedInUser['favorites'];
}

export default function Sidebar ({ closeSidebar, favorites }: SidebarProps) {
  const router = useRouter();
  const [user, setUser] = useUser();
  const [space] = useCurrentSpace();
  const [spaces, setSpaces] = useSpaces();
  const boards = useAppSelector(getSortedBoards);
  const { pages, currentPage, setPages, addPage } = usePages();
  const [spaceFormOpen, setSpaceFormOpen] = useState(false);
  const favoritePageIds = favorites.map(f => f.pageId);
  const intl = useIntl();

  function showSpaceForm () {
    setSpaceFormOpen(true);
  }

  function closeSpaceForm () {
    setSpaceFormOpen(false);
  }

  async function addSpace (spaceOpts: Prisma.SpaceCreateInput) {
    const newSpace = await charmClient.createSpace(spaceOpts);
    setSpaces([...spaces, newSpace]);
    // refresh user permissions
    const _user = await charmClient.getUser();
    setUser(_user);
    router.push(`/${newSpace.domain}`);
  }

  async function deletePage (pageId: string) {
    const page = pages.find(p => p.id === pageId);
    let newPages = pages.filter(p => p.id !== pageId);
    if (page) {
      await charmClient.deletePage(page.id);
      if (pages.length === 1) {
        const newPage = await charmClient.createPage(untitledPage({
          userId: user!.id,
          spaceId: space!.id
        }));
        newPages = [newPage];
      }
    }
    setPages(newPages);
    if (page?.boardId) {
      const board = boards.find(b => b.id === page.boardId);
      if (board) {
        mutator.deleteBlock(
          board,
          intl.formatMessage({ id: 'Sidebar.delete-board', defaultMessage: 'Delete board' }),
          async () => {
            // success
          },
          async () => {
            // error
          }
        );
      }
    }

    // Redirect from current page
    if (page && currentPage && page.id === currentPage.id) {
      router.push(`/${space!.domain}`);
    }
  }

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
        </Modal>
      </WorkspacesContainer>
      {space && (
        <Box display='flex' flexDirection='column' sx={{ height: '100%', flexGrow: 1, width: 'calc(100% - 57px)' }}>
          <Box sx={{ flexGrow: 1 }}>
            <Box sx={{ flexGrow: 1 }}>
              <Box display='flex' flexDirection='column' sx={{ height: '100%' }}>
                <SidebarHeader>
                  <Typography><strong>{space.name}</strong></Typography>
                  <IconButton onClick={closeSidebar}>
                    <ChevronLeftIcon />
                  </IconButton>
                </SidebarHeader>
                <Divider sx={{ mb: 3 }} />
                {favoritePageIds.length > 0 && (
                  <Box mb={2}>
                    <SectionName>
                      FAVORITES
                    </SectionName>
                    <PageNavigation
                      isFavorites={true}
                      space={space}
                      rootPageIds={favoritePageIds}
                    />
                  </Box>
                )}
                <WorkspaceLabel>
                  <SectionName>
                    WORKSPACE
                  </SectionName>
                  <div className='add-a-page'>
                    <NewPageMenu tooltip='Add a page' addPage={page => addPage(page)} />
                  </div>
                </WorkspaceLabel>
                <PageNavigation
                  space={space}
                  deletePage={deletePage}
                />
              </Box>
            </Box>
            <StyledTreeItem
              sx={{ mt: 3 }}
              nodeId='bounties'
              icon={<BountyIcon fontSize='small' />}
              label={
                <PageLink href={`/${space.domain}/bounties`} label='Bounties' />
              }
              ContentProps={{
                className: router.pathname.includes('bounties') ? 'Mui-selected' : ''
              }}
            />
          </Box>
          <Box>
            <Divider />
            <Box p={1} display='flex' alignItems='center' justifyContent='space-between'>
              {user && (
                <Box display='flex' alignItems='center'>
                  <Avatar name={getDisplayName(user)} />
                  <Box pl={1}>
                    <Typography color='secondary'>
                      <strong>{getDisplayName(user)}</strong>
                    </Typography>
                  </Box>
                </Box>
              )}
              <Link href={`/${space.domain}/settings/account`}>
                <IconButton>
                  <SettingsIcon color='secondary' />
                </IconButton>
              </Link>
            </Box>
          </Box>
        </Box>
      )}
    </SidebarContainer>
  );
}
