import { Table, TableHead, TableRow, TableCell, TableBody, Typography, Box } from '@mui/material';
import { Contributor } from 'models';
import { useContributors } from 'hooks/useContributors';
import charmClient from 'charmClient';
import { bindMenu, usePopupState } from 'material-ui-popup-state/hooks';
import Modal, { DialogTitle } from 'components/common/Modal';
import { useState } from 'react';
import { getDisplayName } from 'lib/users';
import Button from 'components/common/Button';
import ContributorListItem, { RoleAction } from './ContributorListItem';
import Legend from '../Legend';

interface Props {
  isAdmin: boolean;
  spaceId: string;
  spaceOwner: string;
}

export default function ContributorList ({ isAdmin, spaceId, spaceOwner }: Props) {
  const popupState = usePopupState({ variant: 'popover', popupId: 'contributor-list' });
  const [contributors, setContributors] = useContributors();
  const [removedContributorId, setRemovedContributorId] = useState<string | null>(null);

  const removedContributor = removedContributorId ? contributors.find(contributor => contributor.id === removedContributorId) : null;

  const closed = popupState.close;

  popupState.close = () => {
    setRemovedContributorId(null);
    closed();
  };

  async function updateContributor (action: RoleAction, contributor: Contributor) {
    switch (action) {

      case 'makeAdmin':
        await charmClient.updateContributor({ spaceId, userId: contributor.id, isAdmin: true });
        setContributors(contributors.map(c => c.id === contributor.id ? { ...c, isAdmin: true } : c));
        break;

      case 'makeContributor':
        await charmClient.updateContributor({ spaceId, userId: contributor.id, isAdmin: false });
        setContributors(contributors.map(c => c.id === contributor.id ? { ...c, isAdmin: false } : c));
        break;

      case 'removeFromSpace':
        setRemovedContributorId(contributor.id);
        popupState.open();
        break;

      default:
        throw new Error('Unknown action');
    }
  }
  return (
    <>
      <Legend>Current Contributors</Legend>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Username</TableCell>
            <TableCell>Join date</TableCell>
            <TableCell></TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {contributors.map(contributor => (
            contributor.isBot === true ? null : (
              <ContributorListItem
                isAdmin={isAdmin}
                key={contributor.id}
                isSpaceOwner={spaceOwner === contributor.id}
                contributor={contributor}
                onChange={updateContributor}
              />
            )
          ))}
        </TableBody>
      </Table>
      {removedContributor && (
      <Modal {...bindMenu(popupState)}>
        <DialogTitle onClose={popupState.close}>Remove from space</DialogTitle>
        <Typography>
          {`Are you sure you want to remove ${getDisplayName(removedContributor)} from space?`}
        </Typography>
        <Box component='div' sx={{ columnSpacing: 2, mt: 3 }}>
          <Button
            color='error'
            sx={{ mr: 2, fontWeight: 'bold' }}
            onClick={async () => {
              await charmClient.removeContributor({ spaceId, userId: removedContributorId as string });
              setContributors(contributors.filter(c => c.id !== removedContributorId));
              setRemovedContributorId(null);
            }}
          >
            {`Remove ${getDisplayName(removedContributor)}`}
          </Button>

          <Button color='secondary' onClick={popupState.close}>Cancel</Button>
        </Box>
      </Modal>
      )}
    </>
  );
}
