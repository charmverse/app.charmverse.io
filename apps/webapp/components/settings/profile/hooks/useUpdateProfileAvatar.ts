import type { UserAvatar } from '@packages/users/interfaces';
import { useCallback, useState } from 'react';

import charmClient from 'charmClient';
import { useSnackbar } from 'hooks/useSnackbar';
import { useUser } from 'hooks/useUser';

const isAvatarObject = (avatar: string | UserAvatar): avatar is UserAvatar => typeof avatar === 'object';

export function useUpdateProfileAvatar() {
  const { setUser, user } = useUser();
  const [isSaving, setIsSaving] = useState(false);
  const { showMessage } = useSnackbar();

  const updateProfileAvatar = useCallback(
    async (avatar: string | UserAvatar) => {
      const updatedAvatar = isAvatarObject(avatar)
        ? avatar
        : {
            avatar,
            avatarContract: null,
            avatarChain: null,
            avatarTokenId: null
          };

      setIsSaving(true);
      try {
        setUser({ avatar: updatedAvatar.avatar });
        const updatedUser = await charmClient.profile.setAvatar(updatedAvatar);
        setUser(updatedUser);
        return updatedUser;
      } catch (e) {
        const message = (e as Error).message || 'Please try again.';
        showMessage(`Failed to update avatar: ${message}`, 'error');
        setUser({ ...user });
        return user;
      } finally {
        setIsSaving(false);
      }
    },
    [user]
  );

  return { updateProfileAvatar, isSaving };
}
