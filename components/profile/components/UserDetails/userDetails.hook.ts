import { useState } from 'react';
import { User } from '@prisma/client';
import charmClient from 'charmClient';
import { UserAvatar } from 'lib/users/interfaces';
import { UserDetailsProps } from 'components/profile/components/UserDetails/UserDetails';

export const useUserDetails = ({ updateUser }: UserDetailsProps) => {
  const [isSaving, setIsSaving] = useState(false);

  const handleUserUpdate = async (data: Partial<User>) => {
    setIsSaving(true);

    try {
      const updatedUser = await charmClient.updateUser(data);
      if (updateUser) {
        updateUser(updatedUser);
      }
    }
    finally {
      setIsSaving(false);

    }

  };

  const handleNftAvatarUpdate = async (data: UserAvatar) => {
    setIsSaving(true);

    try {
      const updatedUser = await charmClient.profile.setAvatar(data);
      if (updateUser) {
        updateUser(updatedUser);
      }
    }
    finally {
      setIsSaving(false);
    }

  };
  return { handleUserUpdate, handleNftAvatarUpdate, isSaving };
};
