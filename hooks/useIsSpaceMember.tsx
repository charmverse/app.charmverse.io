import { useCurrentSpace } from './useCurrentSpace';
import { useUser } from './useUser';

export function useIsSpaceMember() {
  const space = useCurrentSpace();
  const { user } = useUser();

  if (!user || !space) {
    return false;
  }

  return !!user?.spaceRoles.some((sr) => sr.spaceId === space?.id);
}
