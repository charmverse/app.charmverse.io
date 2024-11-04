'use client';

import { yupResolver } from '@hookform/resolvers/yup';
import { useAction } from 'next-safe-action/hooks';
import { useForm } from 'react-hook-form';

import { EditableUserProfile } from 'components/common/Profile/EditableUserProfile';
import { useUser } from 'components/layout/UserProvider';
import { useMdScreen } from 'hooks/useMediaScreens';
import { updateUserDetailsAction } from 'lib/users/updateUserDetailsAction';
import type { UpdateUserDetailsFormValues } from 'lib/users/updateUserDetailsSchema';
import { updateUserDetailsSchema } from 'lib/users/updateUserDetailsSchema';

import type { UserProfileWithPoints } from '../ProfilePage';

export function UserProfileForm({ user }: { user: UserProfileWithPoints }) {
  const isDesktop = useMdScreen();
  const { control, getValues } = useForm<UpdateUserDetailsFormValues>({
    resolver: yupResolver(updateUserDetailsSchema),
    mode: 'onChange',
    defaultValues: {
      avatar: user.avatar ?? undefined,
      displayName: user.displayName
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
      isLoading={isUpdatingUserDetails}
      avatarSize={isDesktop ? 100 : 75}
    />
  );
}
