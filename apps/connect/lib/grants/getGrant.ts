import type { Grant } from '@connect/components/grants/GrantsDetailsPage';

import { getGrants } from './getGrants';

export async function getGrant({ path }: { path: string }): Promise<Grant | null> {
  const grants = await getGrants();

  return grants.find((grant) => grant.path === path) ?? null;
}
