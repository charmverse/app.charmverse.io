import { Contributor } from 'models';
import { useContributors } from './useContributors';

export function useUser () {

  const [contributors, setContributors] = useContributors();

  function setUser (user: Contributor) {
    setContributors([user, ...contributors.filter(c => c.id !== user.id)]);
  }
  return [contributors[0], setUser] as const;

};