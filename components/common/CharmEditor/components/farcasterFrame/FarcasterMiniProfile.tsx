import LogoutIcon from '@mui/icons-material/Logout';
import { Stack, Typography, Button } from '@mui/material';

import Avatar from 'components/common/Avatar';
import { useFarcasterFrame } from 'hooks/useFarcasterFrame';
import { useFarcasterProfile } from 'hooks/useFarcasterProfile';

export function FarcasterMiniProfile() {
  const { farcasterUser, logout } = useFarcasterFrame();
  const { farcasterProfile } = useFarcasterProfile();

  if (farcasterUser?.status === 'approved' && farcasterProfile) {
    return (
      <Stack my={1} alignItems='center' flexDirection='row' justifyContent='space-between'>
        <Stack flexDirection='row' gap={1} alignItems='center'>
          <Avatar avatar={farcasterProfile.body.avatarUrl} name={farcasterProfile.body.displayName} size='medium' />
          <Stack alignItems='flex-start'>
            <Typography variant='body2' fontWeight='bold'>
              {farcasterProfile.body.displayName}
            </Typography>
            <Typography variant='subtitle1' color='secondary' component='span'>
              @{farcasterProfile.body.username}
            </Typography>
          </Stack>
        </Stack>
        <Button color='secondary' variant='text' size='small' onClick={logout}>
          <LogoutIcon fontSize='small' sx={{ mr: 1 }} />
          Logout
        </Button>
      </Stack>
    );
  }

  return null;
}
