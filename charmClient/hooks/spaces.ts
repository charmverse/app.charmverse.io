import type { PaymentMethod, Space, RewardsGithubRepo, SynapsUserKyc, PersonaUserKyc } from '@charmverse/core/prisma';
import type { ProposalWorkflowTyped } from '@charmverse/core/proposals';

import type { UpdateableSpaceFields } from 'lib/spaces/updateSpace';
import type { GithubApplicationData } from 'pages/api/spaces/[id]/github';
import type { ConnectRewardGithubRepoPayload } from 'pages/api/spaces/[id]/github/repo';

import type { MaybeString } from './helpers';
import { useDELETE, useGETImmutable, usePOST, usePUT } from './helpers';

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
