import { useCallback, useMemo } from 'react';

import charmClient from 'charmClient';
import { useUser } from 'hooks/useUser';
import type { UserPreferences } from 'lib/users/interfaces';

export function useUserPreferences() {
  const { user, updateUser } = useUser();
  const userPreferences: UserPreferences = useMemo(() => (user?.preferences as UserPreferences) ?? {}, [user]);

  const updatePreferences = useCallback(
    async (updateObj: Record<string, string>) => {
      const updatedPreferences = { ...userPreferences, ...updateObj };

      const updatedUser = await charmClient.updateUser({ preferences: updatedPreferences });
      updateUser(updatedUser);
    },
    [userPreferences]
  );

  return {
    userPreferences,
    updatePreferences
  };
}
