import { useLocalStorage } from './useLocalStorage';
import { Contributor } from 'models';
import { contributors } from 'seedData';
import { useSpace } from './useSpace';

export function useContributors () {
  const [space] = useSpace();
  const spaceContributors = contributors.filter(c => c.spaceRoles.some(({ spaceId }) => spaceId === space.id));
  console.log('space!', space)
  console.log('contributors', spaceContributors);
  return useLocalStorage<Contributor[]>(`space.${space.id}.contributors`, spaceContributors);
};