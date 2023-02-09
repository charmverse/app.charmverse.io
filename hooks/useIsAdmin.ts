import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useUser } from 'hooks/useUser';
import isSpaceAdmin from 'lib/users/isSpaceAdmin';

export function useIsAdmin(spaceId?: string) {
  const space = useCurrentSpace();
  const { user } = useUser();

  return isSpaceAdmin(user, spaceId || space?.id);
}
