
import { useState } from 'react';
import { useIntl } from 'react-intl';
import styled from '@emotion/styled';
import { Prisma } from '@prisma/client';
import AddIcon from '@mui/icons-material/Add';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import SettingsIcon from '@mui/icons-material/Settings';
import BountyIcon from '@mui/icons-material/RequestPage';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import MuiLink from '@mui/material/Link';
import Typography from '@mui/material/Typography';
import { useWeb3React } from '@web3-react/core';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import charmClient from 'charmClient';
import { usePages } from 'hooks/usePages';
import { useSpaces } from 'hooks/useSpaces';
import { useUser } from 'hooks/useUser';
import { shortenHex } from 'lib/strings';
import { LoggedInUser, Page, Space } from 'models';
import NextLink from 'next/link';
import { useRouter } from 'next/router';
import { pages as seedPages } from 'seedData';
import { greyColor2 } from 'theme/colors';
import { addBoardClicked } from 'components/databases/focalboard/src/components/sidebar/sidebarAddBoardMenu';
import mutator from 'components/databases/focalboard/src//mutator';
import { useAppSelector } from 'components/databases/focalboard/src/store/hooks';
import { getSortedBoards } from 'components/databases/focalboard/src/store/boards';
import getDisplayName from 'lib/users/getDisplayName';
import Avatar from '../Avatar';
import Link from '../Link';
import { Modal } from '../Modal';
import WorkspaceAvatar from '../WorkspaceAvatar';
import CreateWorkspaceForm from '../CreateWorkspaceForm';
import { headerHeight } from './Header';
import PageNavigation, { PageLink, StyledTreeItem } from './PageNavigation';
import NewPageMenu from '../NewPageMenu';

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

const BountyLabel = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: relative;
  cursor: pointer;
  margin-top: 48px;
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
  const [user] = useUser();
  const [space] = useCurrentSpace();
  const [spaces, setSpaces] = useSpaces();
  const boards = useAppSelector(getSortedBoards);
  const { pages, setPages } = usePages();
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
    router.push(`/${newSpace.domain}`);
  }

  async function addPage (page: Partial<Page>) {
    const id = Math.random().toString().replace('0.', '');
    const newPage: Page = {
      boardId: null,
      content: {
        type: 'doc',
        content: [{
          type: 'paragraph',
          content: []
        }]
      },
      contentText: '',
      createdAt: new Date(),
      createdBy: user!.id,
      headerImage: null,
      icon: null,
      updatedAt: new Date(),
      updatedBy: user!.id,
      deletedAt: null,
      id,
      isPublic: false,
      parentId: null,
      path: `page-${id}`,
      spaceId: space.id,
      title: '',
      type: 'page',
      ...page
    };
    if (newPage.type === 'database') {
      await addBoardClicked(boardId => {
        newPage.boardId = boardId;
      }, intl);
    }
    setPages([newPage, ...pages]);

    // add delay to simulate a server call
    setTimeout(() => {
      router.push(`/${space.domain}/${newPage.path}`);
    }, 100);
  }

  function deletePage (pageId: string) {
    const page = pages.find(p => p.id === pageId);
    const newPages = pages.filter(p => p.id !== pageId);
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
  }

  return (
    <SidebarContainer>
      <WorkspacesContainer>
        <Grid container spacing={2} flexDirection='column'>
          {spaces.map(workspace => (
            <Grid item key={workspace.domain}>
              <AvatarLink href={`/${workspace.domain}`} passHref>
                <MuiLink>
                  <WorkspaceAvatar active={space.domain === workspace.domain} name={workspace.name} />
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
      <Box display='flex' flexDirection='column' sx={{ height: '100%', flexGrow: 1 }}>
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
                    pages={pages}
                    spaceId={space.id}
                    pathPrefix={`/${space.domain}`}
                    rootPageIds={favoritePageIds}
                    setPages={setPages}
                    addPage={addPage}
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
              <PageNavigation
                pages={pages}
                spaceId={space.id}
                pathPrefix={`/${space.domain}`}
                setPages={setPages}
                addPage={addPage}
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
                  <Typography>
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
    </SidebarContainer>
  );
}
