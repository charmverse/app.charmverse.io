import { Contributor } from 'models';
import { useContributors } from 'hooks/useContributors';
import ContributorListItem, { RoleAction } from './ContributorListItem';

export default function ContributorList () {

  const [contributors, setContributors] = useContributors();

  function updateContributor (action: RoleAction, contributor: Contributor) {
    console.log('updateContributor', contributor);
  }

  return (
    <>
      {contributors.map(contributor => (
        <ContributorListItem key={contributor.id} contributor={contributor} onChange={updateContributor} />
      ))}
    </>
  );
}
