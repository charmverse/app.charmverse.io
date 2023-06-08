import useSWR from 'swr';

import charmClient from 'charmClient';
import type { InviteLinkPopulatedWithRoles } from 'pages/api/invites';

import { useCurrentSpace } from './useCurrentSpace';

export function useSpaceInvitesList() {
  const space = useCurrentSpace();

  const { data: invites = [], mutate: refreshInvitesList } = useSWR<InviteLinkPopulatedWithRoles[]>(
    `${space?.id}/search-invites`,
    () => charmClient.getInviteLinks(space?.id as string)
  );

  return {
    invites,
    refreshInvitesList
  };
}
