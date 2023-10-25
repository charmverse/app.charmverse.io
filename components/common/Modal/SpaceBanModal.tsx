import { Box } from '@mui/material';
import type { ReactNode } from 'react';
import useSWR from 'swr';

import charmClient from 'charmClient';
import { useSpaces } from 'hooks/useSpaces';
import { useUser } from 'hooks/useUser';

import { Button } from '../Button';
import { Typography } from '../Typography';

import Modal from './Modal';

export function SpaceBanModal({ spaceId, children }: { children: ReactNode; spaceId: string }) {
  const { user } = useUser();

  const { data, isLoading } = useSWR(user ? `${user.id}/${spaceId}/ban-status` : null, () =>
    charmClient.members.checkSpaceBanStatus({
      spaceId
    })
  );

  const isBanned = !!data?.isBanned;

  if (!user) {
    return null;
  }

  return (
    <SpaceBanModalComponent isBanned={isBanned} isLoading={isLoading}>
      {children}
    </SpaceBanModalComponent>
  );
}

export function SpaceBanModalComponent({
  isLoading = false,
  isBanned,
  children
}: {
  isLoading?: boolean;
  isBanned: boolean;
  children: ReactNode;
}) {
  const { user } = useUser();
  const { spaces } = useSpaces();

  return (
    <>
      <Modal title='You have been banned from this space' open={!isLoading && isBanned}>
        <Typography>
          You have been banned from this space. You can't join it. If you think this is a mistake, please contact the
          space admins.
        </Typography>

        <Box gap={2} sx={{ maxWidth: '200px', display: 'flex', flexDirection: 'row', pt: 2 }}>
          {user && !!spaces?.length && (
            <Button sx={{ width: '100%' }} href={`/${spaces[0].domain}`} color='primary'>
              Go to my space
            </Button>
          )}
          {user && !spaces?.length && (
            <Button sx={{ width: '100%' }} href='/createSpace' color='primary'>
              Create a space
            </Button>
          )}
        </Box>
      </Modal>
      {!isBanned && !isLoading && children}
    </>
  );
}
