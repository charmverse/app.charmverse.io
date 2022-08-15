import { UserAvatar } from 'lib/users/interfaces';
import { useCallback } from 'react';
import { useUser } from 'hooks/useUser';
import charmClient from 'charmClient';

const isAvatarObject = (
  avatar: string | UserAvatar
): avatar is UserAvatar => typeof avatar === 'object';

export const useUpdateProfileAvatar = () => {
  const { setUser } = useUser();

  const updateProfileAvatar = useCallback(async (avatar: string | UserAvatar) => {
    const updatedAvatar = isAvatarObject(avatar) ? avatar : {
      avatar,
      avatarContract: null,
      avatarChain: null,
      avatarTokenId: null
    };

    const updatedUser = await charmClient.profile.setAvatar(updatedAvatar);
    setUser(updatedUser);

    return updatedUser;
  }, []);

  return updateProfileAvatar;
};
