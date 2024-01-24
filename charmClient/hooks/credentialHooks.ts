import type { CredentialTemplate } from '@charmverse/core/prisma-client';

import type { MaybeString } from 'charmClient/hooks/helpers';
import { useGET } from 'charmClient/hooks/helpers';
import type { EASAttestationFromApi } from 'lib/credentials/external/getExternalCredentials';

export function useGetUserCredentials({ userId }: { userId: MaybeString }) {
  return useGET<EASAttestationFromApi[]>(userId ? `/api/credentials` : null, { userId });
}
export function useGetCredentialTemplates({ spaceId }: { spaceId: MaybeString }) {
  return useGET<CredentialTemplate[]>(spaceId ? '/api/credentials/templates' : null, { spaceId });
}
