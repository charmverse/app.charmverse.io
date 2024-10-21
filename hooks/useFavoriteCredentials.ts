import { useMemo } from 'react';

import {
  useAddFavoriteCredential,
  useGetUserCredentials,
  useRemoveFavoriteCredential,
  useReorderFavoriteCredentials
} from 'charmClient/hooks/credentials';
import { lowerCaseEqual } from 'lib/utils/strings';
import { isTruthy } from 'lib/utils/types';
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
            _userCredential.type === 'charmverse'
              ? // issued credential id is undefined sometimes
                _userCredential.issuedCredentialId && _userCredential.issuedCredentialId === payload.issuedCredentialId
              : _userCredential.type === 'onchain'
                ? _userCredential.id === payload.attestationId
                : _userCredential.type === 'gitcoin'
                  ? lowerCaseEqual(_userCredential.recipient, payload.gitcoinWalletAddress)
                  : false
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
