
import styled from '@emotion/styled';
import AddIcon from '@mui/icons-material/Add';
import NavigateNextIcon from '@mui/icons-material/ArrowRightAlt';
import { Divider } from '@mui/material';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import MuiLink from '@mui/material/Link';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import type { Prisma } from '@prisma/client';
import NextLink from 'next/link';
import { useRouter } from 'next/router';
import { useState } from 'react';

import charmClient from 'charmClient';
import Button from 'components/common/Button';
import CreateWorkspaceForm from 'components/common/CreateSpaceForm';
import { Modal } from 'components/common/Modal';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useSpaces } from 'hooks/useSpaces';
import { useUser } from 'hooks/useUser';

import NexusAvatar from './NexusAvatar';
import WorkspaceAvatar from './WorkspaceAvatar';

const AvatarLink = styled(NextLink)`
  cursor: pointer;
`;

const WorkspacesContainer = styled.div`
  float: left;
  height: 100%;
  border-right: 1px solid ${({ theme }) => theme.palette.divider};
  padding: ${({ theme }) => theme.spacing(1)};
`;

export default function Workspaces () {

  const router = useRouter();
  const [space] = useCurrentSpace();
  const [spaces, setSpaces] = useSpaces();
  const [spaceFormOpen, setSpaceFormOpen] = useState(false);
  const { user, setUser } = useUser();

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

  return (
    <WorkspacesContainer>
      <Grid container spacing={2} flexDirection='column'>
        <Grid item>
          <NexusAvatar user={user} />
        </Grid>
        <Grid item>
          <Divider sx={{ borderTopWidth: 2, width: '80%', m: '0 auto' }} />
        </Grid>
        {spaces.map(workspace => (
          <Grid item key={workspace.domain}>
            <AvatarLink href={`/${workspace.domain}`} passHref>
              <MuiLink>
                <Tooltip title={workspace.name} placement='right' arrow>
                  <span>
                    <WorkspaceAvatar
                      active={space?.domain === workspace.domain}
                      name={workspace.name}
                      image={workspace.spaceImage}
                    />
                  </span>
                </Tooltip>
              </MuiLink>
            </AvatarLink>
          </Grid>
        ))}
        <Grid item>
          <Tooltip title='Create or join a workspace' placement='top' arrow>
            <IconButton sx={{ borderRadius: '8px' }} onClick={showSpaceForm}><AddIcon /></IconButton>
          </Tooltip>
        </Grid>
      </Grid>
      <Modal open={spaceFormOpen} onClose={closeSpaceForm}>
        <CreateWorkspaceForm onSubmit={addSpace} onCancel={closeSpaceForm} />
        <Typography variant='body2' align='center' sx={{ pt: 2 }}>
          <Button variant='text' href='/join' endIcon={<NavigateNextIcon />}>
            Join an existing workspace
          </Button>
        </Typography>
      </Modal>
    </WorkspacesContainer>
  );
}
