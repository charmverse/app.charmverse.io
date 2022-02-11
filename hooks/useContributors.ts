import { Contributor } from 'models';
import { contributors } from 'seedData';
import { useLocalStorage } from './useLocalStorage';
import { useCurrentSpace } from './useCurrentSpace';

export function useContributors () {
  const [space] = useCurrentSpace();
  const spaceContributors = contributors.filter(
    c => c.spacePermissions.some(({ spaceId }) => spaceId === space.id)
  );
  return useLocalStorage<Contributor[]>(`spaces.${space.id}.contributors`, spaceContributors);
}
