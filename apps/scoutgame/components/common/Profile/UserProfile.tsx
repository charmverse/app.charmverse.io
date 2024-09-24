import type { GithubUser, Scout } from '@charmverse/core/prisma-client';
import { IconButton, Stack, Typography } from '@mui/material';
import Image from 'next/image';

import type { AvatarSize } from '../Avatar';
import { Avatar } from '../Avatar';

type Props = {
  user: Scout & { githubUser?: GithubUser };
  avatarSize?: AvatarSize;
};

export function UserProfile({ user, avatarSize = 'xLarge' }: Props) {
  const { displayName, username, bio, avatar, githubUser } = user;
  return (
    <Stack display='flex' gap={2} alignItems='center' flexDirection='row'>
      <Stack
        alignItems={{
          xs: 'center',
          sm: 'flex-start'
        }}
      >
        <Avatar size={avatarSize} name={username || 'N/A'} src={avatar || undefined} />
      </Stack>
      <Stack width='100%' gap={1}>
        <Typography variant='h5'>{displayName || 'N/A'}</Typography>
        <Stack direction='row' width='100%' alignItems='center'>
          <Typography variant='h6'>{username || 'N/A'}</Typography>
          <IconButton href={`https://warpcast.com/${username}`} target='_blank' rel='noopener noreferrer'>
            <Image src='/images/profile/icons/warpcast-circle-icon.svg' width='25' height='25' alt='warpcast icon' />
          </IconButton>
          {githubUser ? (
            <IconButton
              href={`https://github.com/${githubUser.login}`}
              target='_blank'
              rel='noopener noreferrer'
              sx={{ px: 0 }}
            >
              <Image src='/images/profile/icons/github-circle-icon.svg' width='25' height='25' alt='github icon' />
            </IconButton>
          ) : null}
        </Stack>
        <Typography variant='body2'>{bio}</Typography>
      </Stack>
    </Stack>
  );
}
