import { useCallback, useMemo } from 'react';

import charmClient from 'charmClient';
import { useUser } from 'hooks/useUser';
import type { UserPreferences } from 'lib/users/interfaces';

export function useUserPreferences() {
  const { user, updateUser } = useUser();
  const userPreferences: UserPreferences = useMemo(() => user?.profile || {}, [user]);

  const updatePreferences = useCallback(
    async (updateObj: Partial<UserPreferences>) => {
      const updatedPreferences = { ...userPreferences, ...updateObj };

      await charmClient.updateUserDetails(updatedPreferences);
      updateUser({ profile: updatedPreferences });
    },
    [userPreferences]
  );

  return {
    userPreferences,
    updatePreferences
  };
}
