import { Table, TableBody, TableCell, TableHead, TableRow } from '@mui/material';
import charmClient from 'charmClient';
import ConfirmDeleteModal from 'components/common/Modal/ConfirmDeleteModal';
import { useContributors } from 'hooks/useContributors';
import { bindMenu, usePopupState } from 'material-ui-popup-state/hooks';
import { Contributor } from 'models';
import { useState } from 'react';
import Legend from '../Legend';
import ContributorListItem, { RoleAction } from './ContributorListItem';

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
  const menuState = bindMenu(popupState);

  async function removeContributor () {
    await charmClient.removeContributor({ spaceId, userId: removedContributorId as string });
    setContributors(contributors.filter(c => c.id !== removedContributorId));
    setRemovedContributorId(null);
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
        <ConfirmDeleteModal
          title='Remove contributor'
          onClose={popupState.close}
          open={menuState.open}
          buttonText={`Remove ${removedContributor.username}`}
          onConfirm={removeContributor}
          question={`Are you sure you want to remove ${removedContributor.username} from space?`}
        />
      )}
    </>
  );
}
