import type { CredentialTemplate } from '@charmverse/core/prisma-client';
import type { EASAttestationWithFavorite } from '@packages/credentials/external/getOnchainCredentials';
import type {
  FindIssuableRewardCredentialsInput,
  IssuableRewardApplicationCredentialContent
} from '@packages/credentials/findIssuableRewardCredentials';
import type { UserCredentialsRequest } from '@packages/credentials/getAllUserCredentials';

import { useCurrentSpace } from 'hooks/useCurrentSpace';
import type { AddFavoriteCredentialPayload, ReorderFavoriteCredentialsPayload } from 'pages/api/credentials/favorites';

import { useDELETE, useGET, usePOST, usePUT } from './helpers';

export function useGetUserCredentials({ userId, includeTestnets }: Partial<UserCredentialsRequest>) {
  return useGET<EASAttestationWithFavorite[]>(userId ? `/api/credentials` : null, { userId, includeTestnets });
}

export function useGetCredentialTemplates() {
  const { space } = useCurrentSpace();

  const { data: credentialTemplates, mutate: refreshCredentialTemplates } = useGET<CredentialTemplate[]>(
    space?.id ? '/api/credentials/templates' : null,
    { spaceId: space?.id }
  );

  return {
    credentialTemplates,
    proposalCredentialTemplates: credentialTemplates?.filter((t) => t.schemaType === 'proposal'),
    rewardCredentialTemplates: credentialTemplates?.filter((t) => t.schemaType === 'reward'),
    refreshCredentialTemplates
  };
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

export function useGetIssuableRewardCredentials(data: FindIssuableRewardCredentialsInput) {
  return useGET<IssuableRewardApplicationCredentialContent[]>(
    data.spaceId ? `/api/credentials/rewards/issuable` : null,
    data
  );
}
