import { PopulatedUser } from 'models';
import { users } from 'seedData';
import { useLocalStorage } from './useLocalStorage';
import { useCurrentSpace } from './useCurrentSpace';

export function useContributors () {
  const [space] = useCurrentSpace();
  const spaceContributors = users.filter(
    c => c.spacePermissions.some(({ spaceId }) => spaceId === space.id)
  );
  return useLocalStorage<PopulatedUser[]>(`spaces.${space.id}.contributors`, spaceContributors);
}
