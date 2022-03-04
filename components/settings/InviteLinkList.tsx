import { usePopupState } from 'material-ui-popup-state/hooks';
import { Modal } from 'components/common/Modal';
import useSWR from 'swr';
import Legend from 'components/settings/Legend';
import Button from 'components/common/Button';
import Typography from '@mui/material/Typography';
import { InviteLinkPopulated } from 'pages/api/invites/index';
import InvitesTable from 'components/inviteLinks/InviteLinksTable';
import InviteForm, { FormValues as InviteLinkFormValues } from 'components/inviteLinks/InviteLinkForm';
import charmClient from 'charmClient';

export default function InviteLinkList ({ isAdmin, spaceId }: { isAdmin?: boolean, spaceId: string }) {

  const { data, mutate } = useSWR(`inviteLinks/${spaceId}`, () => charmClient.getInviteLinks(spaceId));
  const {
    isOpen,
    open,
    close
  } = usePopupState({ variant: 'popover', popupId: 'invite-link' });

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
    if (window.confirm('Are you sure?')) {
      await charmClient.deleteInviteLink(link.id);
      // update the list of links
      await mutate();
    }
  }

  return (
    <>
      <Legend>
        Invite Links
        {isAdmin && <Button size='small' variant='outlined' sx={{ float: 'right' }} onClick={open}>Add a link</Button>}
      </Legend>
      {data?.length === 0 && <Typography color='secondary'>No invite links yet</Typography>}
      {data && data?.length > 0 && <InvitesTable invites={data} onDelete={deleteLink} />}
      <Modal open={isOpen} onClose={close}>
        <InviteForm onSubmit={createLink} onClose={close} />
      </Modal>
    </>
  );
}
