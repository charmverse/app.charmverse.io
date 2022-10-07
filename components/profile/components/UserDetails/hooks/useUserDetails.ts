import type { User } from '@prisma/client';
import { useState } from 'react';

import charmClient from 'charmClient';
import type { UserDetailsProps } from 'components/profile/components/UserDetails';

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

  return { handleUserUpdate, isSaving };
};
