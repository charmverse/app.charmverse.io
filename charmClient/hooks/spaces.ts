import type { SpaceWithGates } from 'lib/spaces/interfaces';

import { useGET } from './helpers';

export function useSearchByDomain(domain: string) {
  return useGET<SpaceWithGates>(domain ? `/api/spaces/search-domain` : null, { search: stripUrlParts(domain || '') });
}

function stripUrlParts(maybeUrl: string) {
  return maybeUrl.replace('https://app.charmverse.io/', '').replace('http://localhost:3000/', '').split('/')[0];
}
