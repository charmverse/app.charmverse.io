import { ComponentProps, useState } from 'react';
import styled from '@emotion/styled';
import AddIcon from '@mui/icons-material/Add';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import SettingsIcon from '@mui/icons-material/Settings';
import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import MuiLink from '@mui/material/Link';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Modal from '@mui/material/Modal';
import Typography from '@mui/material/Typography';
import NextLink from 'next/link';
import { useRouter } from 'next/router';
import { isTruthy } from 'lib/types';
import { getKey } from 'hooks/useLocalStorage';
import { usePages } from 'hooks/usePages';
import { useSpace } from 'hooks/useSpace';
import { useSpaces } from 'hooks/useSpaces';
import { useUser } from 'hooks/useUser';
import { shortenedWeb3Address } from 'lib/strings';
import { Contributor, Page, Space } from 'models';
import { pages as seedPages } from 'seedData';
import { greyColor2 } from 'theme/colors';
import Header from './Header';
import WorkspaceAvatar from '../WorkspaceAvatar';
import Link from '../Link';
import Avatar from '../Avatar';
import EmojiCon from '../Emoji';
import ModalContainer from '../ModalContainer';
import CreateWorkspaceForm from './CreateWorkspaceForm';

import PageNavigation, { MenuNode } from './PageNavigation';

const AvatarLink = styled(NextLink)`
  cursor: pointer;
`;

const WorkspacesContainer = styled.div`
  float: left;
  height: 100%;
  border-right: 1px solid ${({ theme }) => theme.palette.divider};
  padding: ${({ theme }) => theme.spacing(1)};
`;

interface SidebarProps {
  closeSidebar: () => void;
  favorites: Contributor['favorites'];
}

export default function Sidebar ({ closeSidebar, favorites }: SidebarProps) {
  const router = useRouter();
  const [user] = useUser();
  const [space] = useSpace();
  const [spaces, setSpaces] = useSpaces();
  const [pages, setPages] = usePages();
  const [spaceFormOpen, setSpaceFormOpen] = useState(false);
  const favoritePageIds = favorites.map(f => f.pageId);

  function showSpaceForm () {
    setSpaceFormOpen(true);
  }

  function closeSpaceForm () {
    setSpaceFormOpen(false);
  }

  function addSpace (newSpace: Space) {
    if (spaces.some(s => s.id === newSpace.id)) {
      throw new Error(`Space with that id already exists: ${newSpace.id}`);
    }
    if (spaces.some(s => s.domain === newSpace.domain)) {
      throw new Error('Space with that domain already exists');
    }
    setSpaces([...spaces, newSpace]);

    // add a first page - note that usePages is for the current space, so we can't use setPages here
    const firstPage: Page = { ...seedPages[0], id: Math.random().toString().replace('0.', ''), spaceId: newSpace.id };
    const key = getKey(`spaces.${newSpace.id}.pages`);
    localStorage.setItem(key, JSON.stringify([firstPage]));

    router.push(`/${newSpace.domain}`);
  }

  return (
    <Box display='flex' sx={{ bgcolor: 'sidebar.background', height: '100%' }}>
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
          <div>
            <ModalContainer onClose={closeSpaceForm}>
              <CreateWorkspaceForm onSubmit={addSpace} onCancel={closeSpaceForm} />
            </ModalContainer>
          </div>
        </Modal>
      </WorkspacesContainer>
      <Box display='flex' flexDirection='column' sx={{ height: '100%', flexGrow: 1 }}>
        <Box sx={{ flexGrow: 1 }}>
          <Box display='flex' flexDirection='column' sx={{ height: '100%' }}>
            <Header>
              <Typography><strong>{space.name}</strong></Typography>
              <IconButton onClick={closeSidebar}>
                <ChevronLeftIcon />
              </IconButton>
            </Header>
            <Divider sx={{ mb: 3 }} />
            {/* <Box>
            <List>
              <NextLink href='' passHref>
                <ListItem button component='a' disableRipple
                  sx={{ py: 1, color: greyColor + ' !important' }}>
                  <ListItemText disableTypography>
                      <Box sx={{ fontSize: 14, fontWeight: 500 }}>Settings</Box>
                  </ListItemText>
                </ListItem>
              </NextLink>
            </List>
          </Box> */}
            {favoritePageIds.length > 0 && (
              <Box mb={2}>
                <Typography sx={{ color: greyColor2, fontSize: 12, letterSpacing: '0.03em', fontWeight: 600, px: 2 }}>
                  FAVORITES
                </Typography>
                <PageNavigation
                  isFavorites={true}
                  pages={pages}
                  pathPrefix={`/${space.domain}`}
                  rootPageIds={favoritePageIds}
                  setPages={setPages}
                />
              </Box>
            )}
            <Typography sx={{ color: greyColor2, fontSize: 12, letterSpacing: '0.03em', fontWeight: 600, px: 2 }}>
              WORKSPACE
            </Typography>
            <PageNavigation
              pages={pages}
              pathPrefix={`/${space.domain}`}
              setPages={setPages}
            />
          </Box>
        </Box>
        <Box>
          <Divider />
          <Box p={1} display='flex' alignItems='center' justifyContent='space-between'>
            {user && (
            <Box display='flex' alignItems='center'>
              <Avatar name={user.username} />
              <Box pl={1}>
                <Typography variant='caption' sx={{ display: 'block' }}>
                  <strong>{user.username}</strong>
                  <br />
                  {shortenedWeb3Address(user.address)}
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
    </Box>
  );
}
