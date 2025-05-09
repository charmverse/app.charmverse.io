import type { InviteLink } from '@charmverse/core/prisma';
import type { PopupState } from 'material-ui-popup-state/hooks';
import { usePopupState } from 'material-ui-popup-state/hooks';
import { useState } from 'react';

import charmClient from 'charmClient';
import Modal from 'components/common/Modal';
import ConfirmDeleteModal from 'components/common/Modal/ConfirmDeleteModal';
import { useIsAdmin } from 'hooks/useIsAdmin';
import { useSpaceInvitesList } from 'hooks/useSpaceInvitesList';

import type { FormValues as InviteLinkFormValues } from './components/InviteLinkForm';
import { WorkspaceSettings } from './components/InviteLinkForm';
import { InvitesTable } from './components/InviteLinksTable';

interface InviteLinksProps {
  popupState: PopupState;
}

export function InviteLinkList({ popupState }: InviteLinksProps) {
  const [removedInviteLink, setRemovedInviteLink] = useState<InviteLink | null>(null);
  const { refreshInvitesList, createInviteLink } = useSpaceInvitesList();

  const { isOpen: isOpenInviteModal, close: closeInviteModal } = popupState;
  const {
    isOpen: isInviteLinkDeleteOpen,
    open: openInviteLinkDelete,
    close: closeInviteLinkDelete
  } = usePopupState({ variant: 'popover', popupId: 'invite-link-delete' });

  function closeInviteLinkDeleteModal() {
    setRemovedInviteLink(null);
    closeInviteLinkDelete();
  }

  async function createLink(values: InviteLinkFormValues) {
    await createInviteLink(values);
    closeInviteModal();
  }

  return (
    <>
      <InvitesTable />
      <Modal open={isOpenInviteModal} onClose={closeInviteModal}>
        <WorkspaceSettings onSubmit={createLink} onClose={closeInviteModal} />
      </Modal>
      {removedInviteLink && (
        <ConfirmDeleteModal
          title='Delete invite link'
          onClose={closeInviteLinkDeleteModal}
          open={isInviteLinkDeleteOpen}
          buttonText='Delete'
          question='Are you sure you want to delete this invite link?'
          onConfirm={async () => {
            await charmClient.deleteInviteLink(removedInviteLink.id);
            // update the list of links
            await refreshInvitesList();
            setRemovedInviteLink(null);
          }}
        />
      )}
    </>
  );
}
