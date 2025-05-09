import type { PublicInviteLinkContext } from '@charmverse/core/prisma';
import useSWR from 'swr';

import charmClient from 'charmClient';
import type { InviteLinkInput } from '@packages/lib/invites/createInviteLink';
import type { InviteLinkWithRoles } from '@packages/lib/invites/getSpaceInviteLinks';

import { useCurrentSpace } from './useCurrentSpace';

export function useSpaceInvitesList() {
  const { space } = useCurrentSpace();

  const {
    data: invites,
    mutate: refreshInvitesList,
    isLoading
  } = useSWR<InviteLinkWithRoles[]>(`${space?.id}/search-invites`, () =>
    charmClient.getInviteLinks(space?.id as string)
  );

  async function createInviteLink({
    maxAgeMinutes,
    maxUses,
    visibleOn
  }: Pick<InviteLinkInput, 'maxAgeMinutes' | 'maxUses' | 'visibleOn'>) {
    const createdLink = await charmClient.createInviteLink({
      spaceId: space?.id as string,
      maxAgeMinutes,
      maxUses,
      visibleOn
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
    privateInvites: invites?.filter((invite) => !invite.visibleOn),
    publicInvites: invites?.filter((invite) => invite.visibleOn) as
      | (InviteLinkWithRoles & {
          visibleOn: PublicInviteLinkContext;
        })[]
      | undefined,
    createInviteLink,
    refreshInvitesList,
    updateInviteLinkRoles,
    deleteInviteLink,
    isLoadingInvites: !invites && isLoading
  };
}
