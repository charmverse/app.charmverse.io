'use client';

import { yupResolver } from '@hookform/resolvers/yup';
import { updateUserDetailsAction } from '@packages/scoutgame/users/updateUserDetailsAction';
import { updateUserDetailsSchema } from '@packages/scoutgame/users/updateUserDetailsSchema';
import type { UpdateUserDetailsFormValues } from '@packages/scoutgame/users/updateUserDetailsSchema';
import { useAction } from 'next-safe-action/hooks';
import { useForm } from 'react-hook-form';

import { EditableUserProfile } from '../../../components/common/Profile/EditableUserProfile';
import { useMdScreen } from '../../../hooks/useMediaScreens';
import { useUser } from '../../../providers/UserProvider';
import type { UserProfileWithPoints } from '../ProfilePage';

export function UserProfileForm({ user }: { user: UserProfileWithPoints }) {
  const isDesktop = useMdScreen();
  const { control, getValues } = useForm<UpdateUserDetailsFormValues>({
    resolver: yupResolver(updateUserDetailsSchema),
    mode: 'onChange',
    defaultValues: {
      avatar: user.avatar ?? undefined,
      displayName: user.displayName,
      bio: user.bio ?? 'Scouting and building in the blockchain space'
    }
  });
  const { refreshUser } = useUser();

  const { execute: updateUserDetails, isExecuting: isUpdatingUserDetails } = useAction(updateUserDetailsAction, {
    onSuccess: ({ data }) => {
      if (data) {
        refreshUser(data);
      }
    }
  });

  const values = getValues();

  return (
    <EditableUserProfile
      user={user}
      control={control}
      onAvatarChange={(url) => {
        updateUserDetails({ avatar: url, displayName: values.displayName });
      }}
      onDisplayNameChange={(displayName) => {
        updateUserDetails({ avatar: values.avatar, displayName });
      }}
      onBioChange={(bio) => {
        updateUserDetails({ avatar: values.avatar, displayName: values.displayName, bio });
      }}
      isLoading={isUpdatingUserDetails}
      avatarSize={isDesktop ? 100 : 75}
    />
  );
}
