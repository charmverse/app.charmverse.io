import type {
  PaymentMethod,
  RewardsGithubRepo,
  Space,
  SynapsUserKyc,
  PersonaUserKyc,
  SpaceExportJob
} from '@charmverse/core/prisma';
import type { ProposalWorkflowTyped } from '@packages/core/proposals';

import type { UpdateableSpaceFields } from 'lib/spaces/updateSpace';

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

export function useArchiveProposalWorkflow(spaceId: string) {
  return usePUT<{ workflowId: string }>(`/api/spaces/${spaceId}/proposals/workflows/archive`);
}

export function useUnarchiveProposalWorkflow(spaceId: string) {
  return usePUT<{ workflowId: string }>(`/api/spaces/${spaceId}/proposals/workflows/unarchive`);
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

export function useRequestExportData(spaceId: string) {
  return usePOST<null, { jobId: string }>(`/api/spaces/${spaceId}/export-data`);
}

export function useGetExportJobStatus(spaceId: string, jobId: MaybeString) {
  return useGET<SpaceExportJob>(spaceId && jobId ? `/api/spaces/${spaceId}/export-data` : null, { jobId });
}
