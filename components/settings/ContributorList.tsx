import { Contributor } from 'models';
import { useContributors } from 'hooks/useContributors';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useUser } from 'hooks/useUser';
import isSpaceAdmin from 'lib/users/isSpaceAdmin';
import charmClient from 'charmClient';
import ContributorListItem, { RoleAction } from './ContributorListItem';

export default function ContributorList () {

  const [contributors, setContributors] = useContributors();
  const [space] = useCurrentSpace();
  const [user] = useUser();
  const isAdmin = isSpaceAdmin(user, space?.id);

  async function updateContributor (action: RoleAction, contributor: Contributor) {
    switch (action) {

      case 'makeAdmin':
        await charmClient.updateContributor({ spaceId: space!.id, userId: contributor.id, role: 'admin' });
        setContributors(contributors.map(c => c.id === contributor.id ? { ...c, role: 'admin' } : c));
        break;

      case 'makeContributor':
        await charmClient.updateContributor({ spaceId: space!.id, userId: contributor.id, role: 'contributor' });
        setContributors(contributors.map(c => c.id === contributor.id ? { ...c, role: 'contributor' } : c));
        break;

      case 'removeFromSpace':
        if (!window.confirm('Please confirm you want to remove this person')) {
          return;
        }
        await charmClient.removeContributor({ spaceId: space!.id, userId: contributor.id });
        setContributors(contributors.filter(c => c.id !== contributor.id));
        break;

      default:
        throw new Error('Unknown action');
    }
  }
  return (
    <>
      {contributors.map(contributor => (
        <ContributorListItem
          isAdmin={isAdmin}
          key={contributor.id}
          isSpaceOwner={space?.createdBy === contributor.id}
          contributor={contributor}
          onChange={updateContributor}
        />
      ))}
    </>
  );
}
