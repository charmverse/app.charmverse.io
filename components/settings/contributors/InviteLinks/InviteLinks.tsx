import { usePopupState } from 'material-ui-popup-state/hooks';
import { Modal } from 'components/common/Modal';
import useSWR from 'swr';
import Legend from 'components/settings/Legend';
import Button from 'components/common/Button';
import Typography from '@mui/material/Typography';
import { InviteLinkPopulated } from 'pages/api/invites/index';
import InviteForm, { FormValues as InviteLinkFormValues } from 'components/settings/contributors/InviteLinks/InviteLinkForm';
import charmClient from 'charmClient';
import ConfirmDeleteModal from 'components/common/Modal/ConfirmDeleteModal';
import { useState } from 'react';
import { InviteLink } from '@prisma/client';
import InvitesTable from './InviteLinksTable';

export default function InviteLinkList ({ isAdmin, spaceId }: { isAdmin: boolean, spaceId: string }) {
  const [removedInviteLink, setRemovedInviteLink] = useState<InviteLink | null>(null);

  const { data, mutate } = useSWR(`inviteLinks/${spaceId}`, () => charmClient.getInviteLinks(spaceId));
  const {
    isOpen,
    open,
    close
  } = usePopupState({ variant: 'popover', popupId: 'invite-link-form' });

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
    close();
  }

  async function deleteLink (link: InviteLinkPopulated) {
    setRemovedInviteLink(link);
    openInviteLinkDelete();
  }

  return (
    <>
      <Legend>
        Invite Links
        {isAdmin && <Button variant='outlined' sx={{ float: 'right' }} onClick={open}>Create a link</Button>}
      </Legend>
      {data && data.length === 0 && <Typography color='secondary'>No invite links yet</Typography>}
      {data && data?.length > 0 && <InvitesTable isAdmin={isAdmin} invites={data} onDelete={deleteLink} />}
      <Modal open={isOpen} onClose={close}>
        <InviteForm onSubmit={createLink} onClose={close} />
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
