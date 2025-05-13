import { usePopupState } from 'material-ui-popup-state/hooks';

import { useIsFreeSpace } from 'hooks/useIsFreeSpace';
import { useMembers } from 'hooks/useMembers';

import { CustomRolesInfoModal } from '../CustomRolesInfoModal';

import { RoleRowBase } from './RoleRowBase';

export function GuestRoleRow({ readOnly }: { readOnly: boolean }) {
  const { guests, members, makeGuest } = useMembers();
  const rolesInfoPopup = usePopupState({ variant: 'popover', popupId: 'roles-info-popup' });

  const { isFreeSpace } = useIsFreeSpace();
  // there must always be at least one admin
  const includeAdmins = members.filter((member) => !member.isBot && member.isAdmin).length > 1;

  // Don't show any guests in free spaces
  const eligibleMembers = isFreeSpace
    ? []
    : members.filter((member) => !member.isBot && (includeAdmins || !member.isAdmin) && !member.isGuest);
  return (
    <>
      <RoleRowBase
        title='Guest'
        description={
          <>
            Guest permissions can not be changed
            <br />
            Guests only have access to Pages, Rewards, Proposals and Forum Posts they have been shared on
          </>
        }
        readOnlyMembers={readOnly}
        members={guests}
        eligibleMembers={eligibleMembers}
        onAddMembers={!readOnly ? makeGuest : undefined}
        upgradeProps={{ upgradeContext: 'invite_guests', onClick: rolesInfoPopup.open }}
      />
      <CustomRolesInfoModal onClose={rolesInfoPopup.close} isOpen={rolesInfoPopup.isOpen} />
    </>
  );
}
