import { User } from 'models';
import { users } from 'seedData';
import { useLocalStorage } from './useLocalStorage';
import { useCurrentSpace } from './useCurrentSpace';

export function useContributors () {
  const [space] = useCurrentSpace();
  const spaceContributors = users.filter(
    c => c.spaceRoles.some(({ spaceId }) => spaceId === space.id)
  );
  return useLocalStorage<User[]>(`spaces.${space.id}.contributors`, spaceContributors);
}
