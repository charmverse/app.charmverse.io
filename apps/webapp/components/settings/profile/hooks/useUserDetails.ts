import type { User } from '@charmverse/core/prisma';
import { useState } from 'react';

import charmClient from 'charmClient';
import { useUser } from 'hooks/useUser';

export function useUserDetails() {
  const [isSaving, setIsSaving] = useState(false);
  const { setUser } = useUser();

  const saveUser = async (data: Partial<User>) => {
    setIsSaving(true);

    try {
      const updatedUser = await charmClient.updateUser(data);
      setUser(updatedUser);
    } finally {
      setIsSaving(false);
    }
  };

  return { saveUser, isSaving };
}
