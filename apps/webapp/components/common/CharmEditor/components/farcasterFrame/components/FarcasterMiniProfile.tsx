import styled from '@emotion/styled';
import LogoutIcon from '@mui/icons-material/Logout';
import { Button, Stack, Tooltip, Typography } from '@mui/material';
import type { FarcasterProfile } from '@packages/farcaster/getFarcasterProfile';

import Avatar from 'components/common/Avatar';
import { useConfirmationModal } from 'hooks/useConfirmationModal';

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
  farcasterProfile: FarcasterProfile['body'];
}) {
  const { showConfirmation } = useConfirmationModal();
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
            window.open(`https://warpcast.com/${farcasterProfile.username}`);
          }}
        >
          <Avatar avatar={farcasterProfile.avatarUrl} name={farcasterProfile.displayName} size='medium' />
          <Stack
            alignItems={{
              xs: 'center',
              md: 'flex-start'
            }}
          >
            <Typography variant='body2' fontWeight='bold'>
              {farcasterProfile.displayName}
            </Typography>
            <Typography variant='subtitle1' color='secondary' component='span'>
              @{farcasterProfile.username}
            </Typography>
          </Stack>
        </Stack>
      </Tooltip>
      <Button
        color='secondary'
        variant='text'
        size='small'
        onClick={() => {
          showConfirmation({
            message:
              'Are you sure you want to logout? You will need to sign in again to use Farcaster which will cost warps.',
            title: 'Logout from Farcaster',
            confirmButton: 'Logout',
            onConfirm: async () => {
              logout();
            }
          });
        }}
      >
        <LogoutIcon fontSize='small' sx={{ mr: 1 }} />
        Logout
      </Button>
    </StyledStackContainer>
  );
}
