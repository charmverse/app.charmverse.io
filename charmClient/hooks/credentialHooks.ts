import type { CredentialTemplate } from '@charmverse/core/prisma-client';

import type { MaybeString } from 'charmClient/hooks/helpers';
import type { EASAttestationWithFavorite } from 'lib/credentials/external/getExternalCredentials';
import type { FavoriteCredentialPayload } from 'lib/credentials/favoriteCredential';

import { useGET, usePUT } from './helpers';

export function useGetUserCredentials({ userId }: { userId: MaybeString }) {
  return useGET<EASAttestationWithFavorite[]>(userId ? `/api/credentials` : null, { userId });
}

export function useGetCredentialTemplates({ spaceId }: { spaceId: MaybeString }) {
  return useGET<CredentialTemplate[]>(spaceId ? '/api/credentials/templates' : null, { spaceId });
}

export function useFavoriteCredential() {
  return usePUT<FavoriteCredentialPayload>(`/api/credentials/favorite`);
}
