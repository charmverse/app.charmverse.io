import useSWR from 'swr';

import charmClient from 'charmClient';

type Props = {
  bountyId?: string | null;
};

export function useBountyPermissions({ bountyId }: Props) {
  const { data, mutate } = useSWR(!bountyId ? null : `compute-bounty-permissions-${bountyId}`, () =>
    charmClient.bounties.computePermissions({
      resourceId: bountyId!
    })
  );

  return { permissions: data, refresh: mutate };
}
