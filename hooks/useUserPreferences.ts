import { useCallback, useMemo } from 'react';

import charmClient from 'charmClient';
import { useUser } from 'hooks/useUser';
import type { UserPreferences } from 'lib/users/interfaces';

export function useUserPreferences() {
  const { user, updateUser } = useUser();
  // TODO: user preferences from UserDetails
  const userPreferences: UserPreferences = useMemo(() => ({}), [user]);

  const updatePreferences = useCallback(
    async (updateObj: Record<string, string>) => {
      const updatedPreferences = { ...userPreferences, ...updateObj };

      const updatedUser = await charmClient.updateUser({});
      updateUser(updatedUser);
    },
    [userPreferences]
  );

  return {
    userPreferences,
    updatePreferences
  };
}
