import { Table, TableHead, TableRow, TableCell, TableBody } from '@mui/material';
import { Contributor } from 'models';
import { useContributors } from 'hooks/useContributors';
import charmClient from 'charmClient';
import Legend from '../Legend';
import ContributorListItem, { RoleAction } from './ContributorListItem';

interface Props {
  isAdmin: boolean;
  spaceId: string;
  spaceOwner: string;
}

export default function ContributorList ({ isAdmin, spaceId, spaceOwner }: Props) {

  const [contributors, setContributors] = useContributors();

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
        if (!window.confirm('Please confirm you want to remove this person')) {
          return;
        }
        await charmClient.removeContributor({ spaceId, userId: contributor.id });
        setContributors(contributors.filter(c => c.id !== contributor.id));
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
    </>
  );
}
