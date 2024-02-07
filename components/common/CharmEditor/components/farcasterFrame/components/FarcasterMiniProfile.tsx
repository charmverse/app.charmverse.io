import styled from '@emotion/styled';
import LogoutIcon from '@mui/icons-material/Logout';
import { Button, Stack, Tooltip, Typography } from '@mui/material';

import Avatar from 'components/common/Avatar';
import type { FarcasterProfile } from 'hooks/useFarcasterProfile';

const StyledStackContainer = styled(Stack)`
  align-items: center;
  cursor: pointer;
  justify-content: space-between;
`;

export function FarcasterMiniProfile({
  logout,
  farcasterProfile
}: {
  logout: VoidFunction;
  farcasterProfile: FarcasterProfile;
}) {
  return (
    <StyledStackContainer
      sx={{
        flexDirection: {
          xs: 'column',
          md: 'row'
        }
      }}
    >
      <Tooltip title='View profile'>
        <Stack
          sx={{
            gap: 1,
            flexDirection: {
              xs: 'column',
              md: 'row'
            },
            alignItems: 'center'
          }}
          onClick={() => {
            window.open(`https://warpcast.com/${farcasterProfile.body.username}`);
          }}
        >
          <Avatar avatar={farcasterProfile.body.avatarUrl} name={farcasterProfile.body.displayName} size='medium' />
          <Stack
            alignItems={{
              xs: 'center',
              md: 'flex-start'
            }}
          >
            <Typography variant='body2' fontWeight='bold'>
              {farcasterProfile.body.displayName}
            </Typography>
            <Typography variant='subtitle1' color='secondary' component='span'>
              @{farcasterProfile.body.username}
            </Typography>
          </Stack>
        </Stack>
      </Tooltip>
      <Button color='secondary' variant='text' size='small' onClick={logout}>
        <LogoutIcon fontSize='small' sx={{ mr: 1 }} />
        Logout
      </Button>
    </StyledStackContainer>
  );
}
