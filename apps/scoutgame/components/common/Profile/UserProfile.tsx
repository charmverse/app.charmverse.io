'use client';

import { IconButton, Stack, Typography } from '@mui/material';
import Image from 'next/image';

import { useMdScreen } from 'hooks/useMediaScreens';
import type { BasicUserInfo } from 'lib/users/interfaces';

import type { AvatarSize } from '../Avatar';
import { Avatar } from '../Avatar';

type UserProfileProps = {
  user: BasicUserInfo;
  avatarSize?: AvatarSize;
};

export function UserProfile({ user, avatarSize = 'xLarge' }: UserProfileProps) {
  const isDesktop = useMdScreen();
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
        <Typography variant={isDesktop ? 'h5' : 'h6'}>{displayName || 'N/A'}</Typography>
        <Stack direction='row' width='100%' alignItems='center' flexWrap='wrap'>
          <Typography variant={isDesktop ? 'h6' : 'body1'}>{username || 'N/A'}</Typography>
          <Stack direction='row' gap={0.5} alignItems='center'>
            <IconButton href={`https://warpcast.com/${username}`} target='_blank' rel='noopener noreferrer'>
              <Image
                src='/images/profile/icons/warpcast-circle-icon.svg'
                width={isDesktop ? '20' : '16'}
                height={isDesktop ? '20' : '16'}
                alt='warpcast icon'
              />
            </IconButton>
            {githubLogin ? (
              <IconButton
                href={`https://github.com/${githubLogin}`}
                target='_blank'
                rel='noopener noreferrer'
                sx={{ px: 0 }}
              >
                <Image
                  src='/images/profile/icons/github-circle-icon.svg'
                  width={isDesktop ? '20' : '16'}
                  height={isDesktop ? '20' : '16'}
                  alt='github icon'
                />
              </IconButton>
            ) : null}
          </Stack>
        </Stack>
        <Typography
          variant={isDesktop ? 'body2' : 'caption'}
          overflow='hidden'
          textOverflow='ellipsis'
          maxWidth='500px'
        >
          {bio}
        </Typography>
      </Stack>
    </Stack>
  );
}
