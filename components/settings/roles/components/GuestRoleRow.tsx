import { usePopupState } from 'material-ui-popup-state/hooks';
import { useState } from 'react';

import ConfirmDeleteModal from 'components/common/Modal/ConfirmDeleteModal';
import { useMembers } from 'hooks/useMembers';
import type { Member } from 'lib/members/interfaces';

import { RoleRowBase } from './RoleRowBase';

export function GuestRoleRow({ readOnly }: { readOnly: boolean }) {
  const { guests, removeGuest } = useMembers();

  const confirmDeletePopup = usePopupState({ variant: 'popover', popupId: 'confirm-delete' });

  const [memberToDelete, setMemberToDelete] = useState<Member | null>(null);

  async function deleteGuest() {
    if (memberToDelete) {
      await removeGuest(memberToDelete.id);
      setMemberToDelete(null);
    }
  }

  return (
    <>
      <RoleRowBase
        title='Guest'
        description={
          <>
            Guest permissions can not be changed
            <br />
            Guests only have access to Pages, Bounties, Proposals and Forum Posts they have been shared on
          </>
        }
        readOnlyMembers={readOnly}
        members={guests}
        removeMember={(userId) => {
          const guest = guests.find((g) => g.id === userId);
          if (guest) {
            setMemberToDelete(guest);
            confirmDeletePopup.open();
          }
        }}
      />

      <ConfirmDeleteModal
        title='Remove guest'
        onClose={() => {
          confirmDeletePopup.close();
          setMemberToDelete(null);
        }}
        open={confirmDeletePopup.isOpen}
        buttonText='Remove guest'
        onConfirm={deleteGuest}
        question={`Are you sure you want to remove ${memberToDelete?.username} from space?`}
      />
    </>
  );
}
