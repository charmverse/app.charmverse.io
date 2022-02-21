import SettingsLayout from 'components/settings/Layout';
import { ReactElement, useEffect, useState } from 'react';
import { usePopupState } from 'material-ui-popup-state/hooks';
import { DialogTitle, Modal } from 'components/common/Modal';
import useSWR from 'swr';
import Legend from 'components/settings/Legend';
import Button from 'components/common/Button';
import Typography from '@mui/material/Typography';
import ContributorRow from 'components/settings/ContributorRow';
import { setTitle } from 'hooks/usePageTitle';
import { useContributors } from 'hooks/useContributors';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import getDisplayName from 'lib/users/getDisplayName';
import { InviteLinkPopulated } from 'pages/api/invites/index';
import InviteForm, { FormValues as InviteLinkFormValues } from 'components/invites/InviteForm';
import charmClient from 'charmClient';

export default function ContributorSettings () {

  const [space] = useCurrentSpace();
  const [contributors] = useContributors();

  // useEffect(() => {
  //   if (space) {
  //     charmClient.getInviteLinks(space.id).then(links => {
  //       setInviteLinks(links);
  //     });
  //   }
  // }, [space]);

  setTitle('Contributors');

  return (
    <>
      {space && <InviteLinks spaceId={space.id} />}
      {/*
      <Legend>
        Token Gates
        <Button color='secondary' size='small' variant='outlined' sx={{ float: 'right' }}>Add a gate</Button>
      </Legend>
      <Typography color='secondary'>No token gates yet</Typography> */}

      <Legend>Current Contributors</Legend>
      {space && contributors.map(contributor => (
        <ContributorRow key={getDisplayName(contributor)} contributor={contributor} spaceId={space.id} />
      ))}
    </>
  );
}

function InviteLinks ({ spaceId }: { spaceId: string }) {

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

  return (
    <>
      <Legend>
        Invite Links
        <Button color='secondary' size='small' variant='outlined' sx={{ float: 'right' }} onClick={open}>Add a link</Button>
      </Legend>
      {data?.length === 0 && <Typography color='secondary'>No invite links yet</Typography>}
      {data?.map(link => (
        <div key={link.id}>{link.code}</div>
      ))}
      <Modal open={isOpen} onClose={close}>
        <InviteForm onSubmit={createLink} onClose={close} />
      </Modal>
    </>
  );
}

ContributorSettings.getLayout = (page: ReactElement) => {
  return (
    <SettingsLayout>
      {page}
    </SettingsLayout>
  );
};
