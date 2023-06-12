import type { PublicInviteLinkContext } from '@charmverse/core/src/prisma-client';
import useSWR from 'swr';

import charmClient from 'charmClient';
import type { InviteLinkInput } from 'lib/invites/createInviteLink';
import type { InviteLinkWithRoles } from 'lib/invites/getSpaceInviteLinks';

import { useCurrentSpace } from './useCurrentSpace';

export function useSpaceInvitesList() {
  const space = useCurrentSpace();

  const { data: invites = [], mutate: refreshInvitesList } = useSWR<InviteLinkWithRoles[]>(
    `${space?.id}/search-invites`,
    () => charmClient.getInviteLinks(space?.id as string)
  );

  async function createInviteLink({
    maxAgeMinutes,
    maxUses,
    publicContext
  }: Pick<InviteLinkInput, 'maxAgeMinutes' | 'maxUses' | 'publicContext'>) {
    const createdLink = await charmClient.createInviteLink({
      spaceId: space?.id as string,
      maxAgeMinutes,
      maxUses,
      publicContext
    });
    refreshInvitesList((invitesData) => {
      const linkWithRoles = {
        ...createdLink,
        roleIds: []
      };
      return invitesData ? [...invitesData, linkWithRoles] : [linkWithRoles];
    });
  }

  async function deleteInviteLink(linkId: string) {
    await charmClient.deleteInviteLink(linkId);
    refreshInvitesList((existingInvites) => {
      return existingInvites?.filter((invite) => invite.id !== linkId);
    });
  }

  async function updateInviteLinkRoles({ inviteLinkId, roleIds }: { inviteLinkId: string; roleIds: string[] }) {
    if (space) {
      await charmClient.updateInviteLinkRoles(inviteLinkId, space.id, roleIds);
      refreshInvitesList();
    }
  }

  return {
    privateInvites: invites.filter((invite) => !invite.publicContext),
    publicInvites: invites.filter((invite) => invite.publicContext) as (InviteLinkWithRoles & {
      publicContext: PublicInviteLinkContext;
    })[],
    createInviteLink,
    refreshInvitesList,
    updateInviteLinkRoles,
    deleteInviteLink
  };
}
