import { Dialog, DialogContent, Typography, useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/system';
import useSWR from 'swr';

import charmClient from 'charmClient';
import LoadingComponent from 'components/common/LoadingComponent';
import { DialogTitle } from 'components/common/Modal';
import { UserDetails } from 'components/profile/components';
import type { Member } from 'lib/members/interfaces';

import { SpacesMemberDetails } from '../../profile/components/SpacesMemberDetails/SpacesMemberDetails';

export function MemberMiniProfile({ member, onClose }: { member: Member; onClose: VoidFunction }) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'));

  const { data: user, isLoading } = useSWR(`users/${member.path}`, () =>
    charmClient.getUserByPath(member.path as string)
  );

  return (
    <Dialog open onClose={onClose} fullScreen={fullScreen} fullWidth>
      {isLoading || !user ? (
        <DialogContent>
          <LoadingComponent isLoading />
        </DialogContent>
      ) : (
        <>
          <DialogTitle sx={{ '&&': { px: 2, py: 2 } }} onClose={onClose}>
            <Typography>{user.username} public profile</Typography>
          </DialogTitle>
          <DialogContent dividers>
            <UserDetails user={user} readOnly />
            <SpacesMemberDetails memberId={user.id} />
          </DialogContent>
        </>
      )}
    </Dialog>
  );
}
