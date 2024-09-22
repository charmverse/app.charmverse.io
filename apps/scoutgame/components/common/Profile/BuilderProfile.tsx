import type { Scout } from '@charmverse/core/prisma-client';
import { IconButton, Stack, Typography } from '@mui/material';
import Image from 'next/image';

import { UserCard } from '../Card/UserCard';

type Props = {
  user: Scout & { description?: string };
};

// @TODO This should be on the user object
const _description = 'This is my short little bio about how sigma I am. Could add this line too and still look cool.';

export function BuilderProfile({ user }: Props) {
  const { displayName, username, description = _description } = user;

  return (
    <Stack display='flex' gap={2} alignItems='center' flexDirection='row'>
      <Stack
        alignItems={{
          xs: 'center',
          sm: 'flex-start'
        }}
        maxWidth={{
          xs: '50%',
          md: '200px'
        }}
      >
        <UserCard user={{ ...user, price: 123 }} withDetails={false} />
      </Stack>
      <Stack width='100%' gap={0.5}>
        <Typography variant='subtitle1'>{displayName || 'N/A'}</Typography>
        <Stack direction='row' width='100%' alignItems='center'>
          <Typography noWrap>@{username || 'N/A'}</Typography>
          <IconButton
            href={`https://warpcast.com/${username}`}
            target='_blank'
            rel='noopener noreferrer'
            sx={{ py: 0 }}
          >
            <Image src='/images/profile/icons/warpcast-circle-icon.svg' width='20' height='20' alt='warpcast icon' />
          </IconButton>
          <IconButton href={`https://github.com/${username}`} target='_blank' rel='noopener noreferrer' sx={{ p: 0 }}>
            <Image src='/images/profile/icons/github-circle-icon.svg' width='20' height='20' alt='github icon' />
          </IconButton>
        </Stack>
        <Typography
          variant='body2'
          sx={{
            display: '-webkit-box',
            WebkitBoxOrient: 'vertical',
            WebkitLineClamp: '3',
            lineClamp: 3,
            overflow: 'hidden'
          }}
        >
          {description}
        </Typography>
        <Typography variant='body2' color='secondary'>
          THIS SEASON (ALL TIME)
        </Typography>
        <Stack flexDirection='row' gap={1}>
          <Typography color='green.main'>500</Typography>
          <Image src='/images/profile/scout-game-green-icon.svg' width='25' height='25' alt='scout game icon' />
          <Typography color='green.main'>(5,000)</Typography>
        </Stack>
        <Typography color='green.main'>5 Builders</Typography>
        <Stack flexDirection='row' gap={1}>
          <Typography color='green.main'>20</Typography>
          <Image src='/images/profile/icons/nft-green-icon.svg' width='25' height='25' alt='nft icon' />
          <Typography color='green.main'>Held</Typography>
        </Stack>
      </Stack>
    </Stack>
  );
}
