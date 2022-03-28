import { Contributor } from 'models';
import { useContributors } from 'hooks/useContributors';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
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
        await charmClient.updateContributor({ spaceId, userId: contributor.id, role: 'admin' });
        setContributors(contributors.map(c => c.id === contributor.id ? { ...c, role: 'admin' } : c));
        break;

      case 'makeContributor':
        await charmClient.updateContributor({ spaceId, userId: contributor.id, role: 'contributor' });
        setContributors(contributors.map(c => c.id === contributor.id ? { ...c, role: 'contributor' } : c));
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
      {contributors.map(contributor => (
        <ContributorListItem
          isAdmin={isAdmin}
          key={contributor.id}
          isSpaceOwner={spaceOwner === contributor.id}
          contributor={contributor}
          onChange={updateContributor}
        />
      ))}
    </>
  );
}
