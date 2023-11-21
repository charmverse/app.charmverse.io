import type { PaymentMethod } from '@charmverse/core/prisma';

import type { SpaceWithGates } from 'lib/spaces/interfaces';

import { useGETImmutable } from './helpers';

export function useSearchByDomain(domain?: string) {
  return useGETImmutable<SpaceWithGates>(domain ? `/api/spaces/search-domain` : null, {
    search: stripUrlParts(domain || '')
  });
}

export function useGetPaymentMethods(spaceId?: string) {
  return useGETImmutable<PaymentMethod[]>(spaceId ? `/api/payment-methods` : null, {
    spaceId
  });
}

function stripUrlParts(maybeUrl: string) {
  return maybeUrl.replace('https://app.charmverse.io/', '').replace('http://localhost:3000/', '').split('/')[0];
}
