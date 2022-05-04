import { usePopupState } from 'material-ui-popup-state/hooks';
import { Modal } from 'components/common/Modal';
import useSWR from 'swr';
import Legend from 'components/settings/Legend';
import Button from 'components/common/Button';
import Typography from '@mui/material/Typography';
import { InviteLinkPopulated } from 'pages/api/invites/index';
import InviteForm, { FormValues as InviteLinkFormValues } from 'components/settings/contributors/InviteLinks/InviteLinkForm';
import charmClient from 'charmClient';
import InvitesTable from './InviteLinksTable';

export default function InviteLinkList ({ isAdmin, spaceId }: { isAdmin: boolean, spaceId: string }) {

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
        {isAdmin && <Button variant='outlined' sx={{ float: 'right' }} onClick={open}>Add a link</Button>}
      </Legend>
      {data && data.length === 0 && <Typography color='secondary'>No invite links yet</Typography>}
      {data && data?.length > 0 && <InvitesTable isAdmin={isAdmin} invites={data} onDelete={deleteLink} />}
      <Modal open={isOpen} onClose={close}>
        <InviteForm onSubmit={createLink} onClose={close} />
      </Modal>
    </>
  );
}
