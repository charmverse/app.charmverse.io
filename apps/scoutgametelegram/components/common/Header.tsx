'use client';

import { Avatar, Stack, Typography } from '@mui/material';
import { useUser } from '@packages/scoutgame-ui/providers/UserProvider';
import Image from 'next/image';

export function Header() {
  const { user } = useUser();

  return (
    <Stack position='static' flexDirection='row' justifyContent='space-between' alignItems='center' width='100%' p={1}>
      <Image
        src='/images/scout-game-logo.png'
        width={77.77}
        height={35}
        alt='Scout Game logo'
        priority={true}
        style={{ verticalAlign: 'middle', zIndex: 2 }}
      />
      {user ? (
        <Stack
          sx={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 1,
            borderRadius: '30px',
            zIndex: 2,
            position: 'relative',
            borderColor: 'secondary.main',
            borderWidth: '2px',
            borderStyle: 'solid',
            pointerEvents: 'none'
          }}
        >
          <Typography fontSize='16px' sx={{ pl: 2 }} color='text.primary' data-test='user-points-balance'>
            {user.currentBalance}
          </Typography>
          <Image
            src='/images/scout-game-profile-icon.png'
            width={18}
            height={12}
            alt='Scout Game points icon'
            priority={true}
          />
          <Avatar src={user?.avatar || undefined} style={{ width: 30, height: 30 }} />
        </Stack>
      ) : null}
    </Stack>
  );
}
