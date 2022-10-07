import type { InviteLink } from '@prisma/client';
import type { PopupState } from 'material-ui-popup-state/hooks';
import { bindPopover, usePopupState } from 'material-ui-popup-state/hooks';
import { useState } from 'react';
import useSWR from 'swr';

import charmClient from 'charmClient';
import { Modal } from 'components/common/Modal';
import ConfirmDeleteModal from 'components/common/Modal/ConfirmDeleteModal';
import type { InviteLinkPopulated } from 'pages/api/invites/index';

import type { FormValues as InviteLinkFormValues } from './components/InviteLinkForm';
import InviteForm from './components/InviteLinkForm';
import InvitesTable from './components/InviteLinksTable';

interface InviteLinksProps {
  isAdmin: boolean;
  spaceId: string;
  popupState: PopupState;
}

export default function InviteLinkList ({ isAdmin, spaceId, popupState }: InviteLinksProps) {
  const [removedInviteLink, setRemovedInviteLink] = useState<InviteLink | null>(null);
  const { data = [], mutate } = useSWR(`inviteLinks/${spaceId}`, () => charmClient.getInviteLinks(spaceId));

  const {
    isOpen: isInviteLinkDeleteOpen,
    open: openInviteLinkDelete,
    close: closeInviteLinkDelete
  } = usePopupState({ variant: 'popover', popupId: 'invite-link-delete' });

  function closeInviteLinkDeleteModal () {
    setRemovedInviteLink(null);
    closeInviteLinkDelete();
  }

  async function createLink (values: InviteLinkFormValues) {
    await charmClient.createInviteLink({
      spaceId,
      ...values
    });
    // update the list of links
    await mutate();
    popupState.close();
  }

  async function deleteLink (link: InviteLinkPopulated) {
    setRemovedInviteLink(link);
    openInviteLinkDelete();
  }

  return (
    <>
      <InvitesTable isAdmin={isAdmin} invites={data} refetchInvites={mutate} onDelete={deleteLink} />
      <Modal {...bindPopover(popupState)}>
        <InviteForm onSubmit={createLink} onClose={popupState.close} />
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
            await mutate();
            setRemovedInviteLink(null);
          }}
        />
      )}
    </>
  );
}
