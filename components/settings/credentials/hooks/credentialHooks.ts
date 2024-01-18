import type { CredentialTemplate } from '@charmverse/core/prisma-client';

import type { MaybeString } from 'charmClient/hooks/helpers';
import { useGET } from 'charmClient/hooks/helpers';
import type { PublishedSignedCredential } from 'lib/credentials/queriesAndMutations';

export function useGetUserCredentials({ userId }: { userId: MaybeString }) {
  return useGET<PublishedSignedCredential[]>(userId ? `/api/credentials` : null, { userId });
}
export function useGetCredentialTemplates({ spaceId }: { spaceId: MaybeString }) {
  return useGET<CredentialTemplate[]>(spaceId ? '/api/credentials/templates' : null, { spaceId });
}
