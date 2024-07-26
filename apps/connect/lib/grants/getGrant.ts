import type { Grant } from './getGrants';
import { getGrants } from './getGrants';

export async function getGrant({ path }: { path: string }): Promise<Grant | null> {
  const grants = await getGrants();

  return grants.find((grant) => grant.path === path) ?? null;
}
