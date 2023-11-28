import type { PaymentMethod } from '@charmverse/core/prisma';

import type { WorkflowTemplate } from 'lib/spaces/getProposalWorkflowTemplates';
import type { SpaceWithGates } from 'lib/spaces/interfaces';

import type { MaybeString } from './helpers';
import { useGETImmutable } from './helpers';

export function useSearchByDomain(domain: MaybeString) {
  return useGETImmutable<SpaceWithGates>(domain ? `/api/spaces/search-domain` : null, {
    search: stripUrlParts(domain || '')
  });
}

export function useGetPaymentMethods(spaceId: MaybeString) {
  return useGETImmutable<PaymentMethod[]>(spaceId ? `/api/payment-methods` : null, {
    spaceId
  });
}

export function useGetSpaceProposalWorkflows(spaceId: MaybeString) {
  return useGETImmutable<PaymentMethod[]>(spaceId ? `/api/payment-methods` : null, {
    spaceId
  });
}

export function useGetProposalWorkflowTemplates(spaceId: MaybeString) {
  return useGETImmutable<WorkflowTemplate[]>(spaceId ? `/api/spaces/${spaceId}/proposals/workflow-templates` : null);
}

function stripUrlParts(maybeUrl: string) {
  return maybeUrl.replace('https://app.charmverse.io/', '').replace('http://localhost:3000/', '').split('/')[0];
}
