import { useMemo } from 'react';

import {
  useAddFavoriteCredential,
  useGetUserCredentials,
  useRemoveFavoriteCredential,
  useReorderFavoriteCredentials
} from 'charmClient/hooks/credentials';
import { isTruthy } from 'lib/utilities/types';
import type { AddFavoriteCredentialPayload, ReorderFavoriteCredentialsPayload } from 'pages/api/credentials/favorites';

import { useUser } from './useUser';

export function useFavoriteCredentials() {
  const { user } = useUser();
  const { data: userCredentials, mutate: mutateUserCredentials } = useGetUserCredentials({ userId: user?.id });
  const { trigger: addFavoriteCredential, isMutating: isAddFavoriteCredentialLoading } = useAddFavoriteCredential();
  const { trigger: removeFavoriteCredential, isMutating: isRemoveFavoriteCredentialLoading } =
    useRemoveFavoriteCredential();
  const { trigger: reorderFavoriteCredentials } = useReorderFavoriteCredentials();

  const favoriteCredentials = useMemo(
    () =>
      (userCredentials || [])
        .filter((item) => isTruthy(item.favoriteCredentialId))
        .map((credential) => ({ index: credential.index, id: credential.favoriteCredentialId }))
        .sort((a, b) => (a.index || 0) - (b.index || 0)) as ReorderFavoriteCredentialsPayload,
    [userCredentials]
  );

  const reorderFavorites = async (draggedFavoriteCredentialId: string, droppedOnFavoriteCredentialId: string) => {
    const siblings = favoriteCredentials.filter(({ id }) => id !== draggedFavoriteCredentialId) ?? [];
    const originIndex = siblings.findIndex(({ id }) => id === droppedOnFavoriteCredentialId);
    const reorderFavoriteCredentialsPayload: ReorderFavoriteCredentialsPayload = [
      ...siblings.slice(0, originIndex),
      { id: draggedFavoriteCredentialId, index: originIndex },
      ...siblings.slice(originIndex)
    ].map((f, index) => ({ ...f, index }));

    await reorderFavoriteCredentials(reorderFavoriteCredentialsPayload);
    mutateUserCredentials();
  };

  const removeFavorite = async (favoriteCredentialId: string) => {
    await removeFavoriteCredential({ favoriteCredentialId });
    mutateUserCredentials(
      (_userCredentials) => {
        if (!_userCredentials) {
          return _userCredentials;
        }

        return _userCredentials.map((_userCredential) => {
          if (_userCredential.favoriteCredentialId === favoriteCredentialId) {
            return {
              ..._userCredential,
              favoriteCredentialId: null,
              index: -1
            };
          }
          return _userCredential;
        });
      },
      {
        revalidate: false
      }
    );
  };

  const addFavorite = async (payload: AddFavoriteCredentialPayload) => {
    const favoriteCredential = await addFavoriteCredential(payload);
    mutateUserCredentials(
      (_userCredentials) => {
        if (!_userCredentials) {
          return _userCredentials;
        }

        return _userCredentials.map((_userCredential) => {
          if (
            _userCredential.issuedCredentialId === payload.issuedCredentialId ||
            _userCredential.id === payload.attestationId
          ) {
            return {
              ..._userCredential,
              favoriteCredentialId: favoriteCredential?.favoriteCredentialId ?? null,
              index: favoriteCredential?.index ?? -1
            };
          }

          return _userCredential;
        });
      },
      {
        revalidate: false
      }
    );
  };

  return {
    isRemoveFavoriteCredentialLoading,
    isAddFavoriteCredentialLoading,
    favoriteCredentials,
    reorderFavorites,
    removeFavorite,
    addFavorite
  };
}

// Credential 1: "3fd35941-509b-4cae-83f7-736f4b0fb3eb"
// Credential 2: "061a56d1-4121-4bd2-a76a-e33f79b81c20"
// Credential 3: "10b00750-11f1-4754-a635-f5539384761c"
