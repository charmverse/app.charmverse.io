import { useCallback, useState } from 'react';

import charmClient from 'charmClient';
import { useSnackbar } from 'hooks/useSnackbar';
import { useUser } from 'hooks/useUser';
import type { UserAvatar } from 'lib/users/interfaces';

const isAvatarObject = (
  avatar: string | UserAvatar
): avatar is UserAvatar => typeof avatar === 'object';

export function useUpdateProfileAvatar () {
  const { setUser, user } = useUser();
  const [isSaving, setIsSaving] = useState(false);
  const { showMessage } = useSnackbar();

  const updateProfileAvatar = useCallback(async (avatar: string | UserAvatar) => {
    const updatedAvatar = isAvatarObject(avatar) ? avatar : {
      avatar,
      avatarContract: null,
      avatarChain: null,
      avatarTokenId: null
    };

    setIsSaving(true);
    try {
      const updatedUser = await charmClient.profile.setAvatar(updatedAvatar);
      setUser(updatedUser);

      return updatedUser;
    }
    catch (e) {
      showMessage('Failed to update avatar. Please try again.', 'error');
      return user;
    }
    finally {
      setIsSaving(false);
    }

  }, []);

  return { updateProfileAvatar, isSaving };
}
