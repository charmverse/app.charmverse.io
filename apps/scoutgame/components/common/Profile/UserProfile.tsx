import { IconButton, Stack, Typography } from '@mui/material';
import Image from 'next/image';

import type { BasicUserInfo } from 'lib/users/interfaces';

import type { AvatarSize } from '../Avatar';
import { Avatar } from '../Avatar';

type UserProfileProps = {
  user: BasicUserInfo;
  avatarSize?: AvatarSize;
};

export function UserProfile({ user, avatarSize = 'xLarge' }: UserProfileProps) {
  const { displayName, username, bio, avatar, githubLogin } = user;
  return (
    <Stack
      display='flex'
      gap={2}
      alignItems='center'
      flexDirection='row'
      p={{
        xs: 0,
        md: 2
      }}
    >
      {user.avatar ? (
        <Stack
          alignItems={{
            xs: 'center',
            sm: 'flex-start'
          }}
        >
          <Avatar size={avatarSize} name={username || 'N/A'} src={avatar || undefined} />
        </Stack>
      ) : null}
      <Stack width='100%'>
        <Typography variant='h5'>{displayName || 'N/A'}</Typography>
        <Stack direction='row' width='100%' alignItems='center' flexWrap='wrap'>
          <Typography variant='h6'>{username || 'N/A'}</Typography>
          <Stack direction='row' gap={0.5} alignItems='center'>
            <IconButton href={`https://warpcast.com/${username}`} target='_blank' rel='noopener noreferrer'>
              <Image src='/images/profile/icons/warpcast-circle-icon.svg' width='20' height='20' alt='warpcast icon' />
            </IconButton>
            {githubLogin ? (
              <IconButton
                href={`https://github.com/${githubLogin}`}
                target='_blank'
                rel='noopener noreferrer'
                sx={{ px: 0 }}
              >
                <Image src='/images/profile/icons/github-circle-icon.svg' width='20' height='20' alt='github icon' />
              </IconButton>
            ) : null}
          </Stack>
        </Stack>
        <Typography variant='body2' overflow='hidden' textOverflow='ellipsis' maxWidth='500px'>
          {bio}
        </Typography>
      </Stack>
    </Stack>
  );
}
