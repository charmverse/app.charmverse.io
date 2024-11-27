'use client';

import type { Scout, TalentProfile } from '@charmverse/core/prisma';
import { Stack, Typography } from '@mui/material';

import { useIsMounted } from '../../../hooks/useIsMounted';
import { useMdScreen } from '../../../hooks/useMediaScreens';
import type { AvatarSize } from '../Avatar';
import { Avatar } from '../Avatar';

import { ProfileLinks } from './ProfileLinks';
import { ShareProfile } from './ShareProfile';

// Use a unique type since sometimes this prop comes from the session user, but sometimes it comes from the builder queries
type UserProfileData = Pick<Scout, 'id' | 'path'> & {
  bio?: string | null;
  avatar?: string | null;
  displayName: string;
  githubLogin?: string;
  farcasterName?: string | null;
  talentProfile?: TalentProfile | null;
  hasMoxieProfile?: boolean;
};

type UserProfileProps = {
  user: UserProfileData;
  avatarSize?: AvatarSize;
};

export function UserProfile({ user, avatarSize = 'xLarge' }: UserProfileProps) {
  const isDesktop = useMdScreen();
  const { displayName, bio, avatar, githubLogin, farcasterName } = user;
  const isMounted = useIsMounted();

  // We are using the mounted flag here because MUI media query returns false on the server and true on the client and it throws warnings
  if (!isMounted) {
    return null;
  }

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
          <Avatar size={avatarSize} name={displayName} src={avatar || undefined} />
        </Stack>
      ) : null}
      <Stack width='100%'>
        <Stack direction='row' width='100%' alignItems='center' justifyContent='space-between'>
          <Stack
            direction='row'
            gap={1}
            alignItems='center'
            flexWrap='wrap'
            rowGap={{
              xs: 0,
              md: 1
            }}
          >
            <Typography variant={isDesktop ? 'h5' : 'h6'}>{displayName}</Typography>
            <ProfileLinks
              farcasterName={farcasterName}
              githubLogin={githubLogin}
              talentProfile={user.talentProfile}
              hasMoxieProfile={user.hasMoxieProfile}
            />
            {!isDesktop ? <ShareProfile userPath={user.path} /> : null}
          </Stack>
          {isDesktop ? <ShareProfile userPath={user.path} /> : null}
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
