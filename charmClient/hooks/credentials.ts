import type { CredentialTemplate } from '@charmverse/core/prisma-client';

import type { MaybeString } from 'charmClient/hooks/helpers';
import type { EASAttestationWithFavorite } from 'lib/credentials/external/getOnchainCredentials';
import type { AddFavoriteCredentialPayload, ReorderFavoriteCredentialsPayload } from 'pages/api/credentials/favorites';

import { useDELETE, useGET, usePOST, usePUT } from './helpers';

export function useGetUserCredentials({ userId }: { userId: MaybeString }) {
  return useGET<EASAttestationWithFavorite[]>(userId ? `/api/credentials` : null, { userId });
}

export function useGetCredentialTemplates({ spaceId }: { spaceId: MaybeString }) {
  return useGET<CredentialTemplate[]>(spaceId ? '/api/credentials/templates' : null, { spaceId });
}

export function useReorderFavoriteCredentials() {
  return usePUT<ReorderFavoriteCredentialsPayload>(`/api/credentials/favorites`);
}

export function useAddFavoriteCredential() {
  return usePOST<AddFavoriteCredentialPayload, { index: number; favoriteCredentialId: string }>(
    `/api/credentials/favorites`
  );
}

export function useRemoveFavoriteCredential() {
  return useDELETE<{ favoriteCredentialId: string }>(`/api/credentials/favorites`);
}
