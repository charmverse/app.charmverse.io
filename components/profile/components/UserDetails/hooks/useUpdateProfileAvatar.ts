import { UserAvatar } from 'lib/users/interfaces';
import { useCallback, useState } from 'react';
import { useUser } from 'hooks/useUser';
import charmClient from 'charmClient';
import { stubTrue } from 'lodash';

const isAvatarObject = (
  avatar: string | UserAvatar
): avatar is UserAvatar => typeof avatar === 'object';

export const useUpdateProfileAvatar = () => {
  const { setUser, user } = useUser();
  const [isSaving, setIsSaving] = useState(false);

  const updateProfileAvatar = useCallback(async (avatar: string | UserAvatar) => {
    const updatedAvatar = isAvatarObject(avatar) ? avatar : {
      avatar,
      avatarContract: null,
      avatarChain: null,
      avatarTokenId: null
    };

    setIsSaving(stubTrue);
    try {
      const updatedUser = await charmClient.profile.setAvatar(updatedAvatar);
      setUser(updatedUser);

      return updatedUser;
    }
    catch (e) {
      return user;
    }
    finally {
      setIsSaving(false);
    }

  }, []);

  return { updateProfileAvatar, isSaving };
};
