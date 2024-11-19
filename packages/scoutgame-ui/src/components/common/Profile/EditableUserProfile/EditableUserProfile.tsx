'use client';

import type { Scout } from '@charmverse/core/prisma';
import { Stack } from '@mui/material';
import type { Control } from 'react-hook-form';

import { useIsMounted } from '../../../../hooks/useIsMounted';
import { useMdScreen } from '../../../../hooks/useMediaScreens';

import { EditableAvatar } from './EditableAvatar';
import { EditableBio } from './EditableBio';
import { EditableDisplayName } from './EditableDisplayName';

type UserProfileData = Pick<Scout, 'id' | 'path'> & {
  avatar?: string | null;
  displayName: string;
  githubLogin?: string;
  farcasterName?: string | null;
  bio?: string | null;
};

type UserProfileProps = {
  user: UserProfileData;
  avatarSize?: number;
  control: Control<
    {
      avatar: string;
      displayName: string;
    } & any,
    any
  >;
  onAvatarChange?: (url: string) => void;
  onDisplayNameChange?: (displayName: string) => void;
  isLoading?: boolean;
  onBioChange?: (bio: string) => void;
};

export function EditableUserProfile({
  user,
  control,
  onAvatarChange,
  onDisplayNameChange,
  isLoading,
  onBioChange,
  avatarSize = 100
}: UserProfileProps) {
  const isDesktop = useMdScreen();
  const isMounted = useIsMounted();

  if (!isMounted) {
    return null;
  }

  return (
    <Stack
      display='flex'
      gap={2}
      alignItems='center'
      flexDirection='row'
      my={1}
      p={{
        xs: 1,
        md: 2
      }}
    >
      <EditableAvatar control={control} avatarSize={avatarSize} isLoading={isLoading} onAvatarChange={onAvatarChange} />
      <Stack width='100%'>
        <EditableDisplayName
          displayName={user.displayName}
          onDisplayNameChange={onDisplayNameChange}
          control={control}
          isLoading={isLoading}
          githubLogin={user.githubLogin}
          farcasterName={user.farcasterName}
        />
        <EditableBio bio={user.bio} onBioChange={onBioChange} control={control} isDesktop={isDesktop} />
      </Stack>
    </Stack>
  );
}
