import type { PersonaUserKyc, SynapsUserKyc } from '@charmverse/core/prisma-client';

import type { KycCredentials } from '@packages/lib/kyc/getKycCredentials';
import type { PersonaInquiry } from '@packages/lib/kyc/persona/interfaces';
import type { SynapsSession } from '@packages/lib/kyc/synaps/interfaces';

import type { MaybeString } from './helpers';
import { useGET, usePOST } from './helpers';

export function useGetKycCredentials(spaceId: MaybeString) {
  return useGET<KycCredentials>(spaceId ? `/api/spaces/${spaceId}/kyc-credentials` : null);
}

export function useUpdateKycCredentials(spaceId: MaybeString) {
  return usePOST<KycCredentials, KycCredentials>(`/api/spaces/${spaceId}/kyc-credentials`);
}

export function useInitSynapsSession(spaceId: MaybeString) {
  return usePOST<undefined, SynapsSession>(`/api/spaces/${spaceId}/kyc-credentials/synaps`);
}

export function useGetSynapsSession(spaceId: MaybeString, userId: MaybeString) {
  return useGET<SynapsUserKyc | null>(
    spaceId ? `/api/spaces/${spaceId}/kyc-credentials/synaps${userId ? `/${userId}` : ''}` : null
  );
}

export function useGetPersonaInquiry(spaceId: MaybeString, userId: MaybeString) {
  return useGET<PersonaInquiry | null>(
    spaceId ? `/api/spaces/${spaceId}/kyc-credentials/persona${userId ? `/${userId}` : ''}` : null
  );
}

export function useInitPersonaInquiry(spaceId: MaybeString) {
  return usePOST<undefined, PersonaUserKyc>(`/api/spaces/${spaceId}/kyc-credentials/persona`);
}
