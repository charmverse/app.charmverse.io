import type { PaymentMethod, Space, RewardsGithubRepo, SynapsUserKyc, PersonaUserKyc } from '@charmverse/core/prisma';
import type { ProposalWorkflowTyped } from '@charmverse/core/proposals';

import type { KycCredentials } from 'lib/kyc/getKycCredentials';
import type { PersonaInquiry } from 'lib/kyc/persona/interfaces';
import type { SynapsSession } from 'lib/kyc/synaps/interfaces';
import type { UpdateableSpaceFields } from 'lib/spaces/updateSpace';
import type { GithubApplicationData } from 'pages/api/spaces/[id]/github';
import type { ConnectRewardGithubRepoPayload } from 'pages/api/spaces/[id]/github/repo';

import type { MaybeString } from './helpers';
import { useDELETE, useGET, useGETImmutable, usePOST, usePUT } from './helpers';

export function useSearchByDomain(domain: MaybeString) {
  return useGETImmutable<Space | null>(domain ? `/api/spaces/search-domain` : null, {
    search: stripUrlParts(domain || '')
  });
}

export function useGetPaymentMethods(spaceId: MaybeString) {
  return useGETImmutable<PaymentMethod[]>(spaceId ? `/api/payment-methods` : null, {
    spaceId
  });
}

export function useGetProposalWorkflows(spaceId: MaybeString) {
  return useGETImmutable<ProposalWorkflowTyped[]>(spaceId ? `/api/spaces/${spaceId}/proposals/workflows` : null);
}

export function useUpsertProposalWorkflow(spaceId: MaybeString) {
  return usePOST<ProposalWorkflowTyped>(`/api/spaces/${spaceId}/proposals/workflows`);
}

export function useDeleteProposalWorkflow(spaceId: MaybeString) {
  return useDELETE<{ workflowId: string }>(`/api/spaces/${spaceId}/proposals/workflows`);
}

function stripUrlParts(maybeUrl: string) {
  return maybeUrl.replace('https://app.charmverse.io/', '').replace('http://localhost:3000/', '').split('/')[0];
}

export function useUpdateSpace(spaceId: MaybeString) {
  return usePUT<UpdateableSpaceFields, Space>(`/api/spaces/${spaceId}`);
}

export function useDisconnectGithubApplication(spaceId: string) {
  return useDELETE(`/api/spaces/${spaceId}/github/disconnect`);
}

export function useGetGithubApplicationData(spaceId: string) {
  return useGETImmutable<GithubApplicationData>(`/api/spaces/${spaceId}/github`);
}

export function useConnectGithubRepository(spaceId: string) {
  return usePOST<ConnectRewardGithubRepoPayload, RewardsGithubRepo>(`/api/spaces/${spaceId}/github/repo`);
}

export function useGetKycCredentials(spaceId: MaybeString) {
  return useGET<KycCredentials>(spaceId ? `/api/spaces/${spaceId}/kyc-credentials` : null);
}

export function useUpdateKycCredentials(spaceId: MaybeString) {
  return usePOST<KycCredentials, KycCredentials>(`/api/spaces/${spaceId}/kyc-credentials`);
}

export function useInitSynapsSession(spaceId: MaybeString) {
  return usePOST<undefined, SynapsSession>(`/api/spaces/${spaceId}/kyc-credentials/synaps`);
}

export function useGetSynapsSession(spaceId: MaybeString) {
  return useGET<SynapsUserKyc | null>(`/api/spaces/${spaceId}/kyc-credentials/synaps`);
}

export function useGetPersonaInquiry(spaceId: MaybeString) {
  return useGET<PersonaInquiry | null>(spaceId ? `/api/spaces/${spaceId}/kyc-credentials/persona` : null);
}

export function useInitPersonaInquiry(spaceId: MaybeString) {
  return usePOST<undefined, PersonaUserKyc>(`/api/spaces/${spaceId}/kyc-credentials/persona`);
}
