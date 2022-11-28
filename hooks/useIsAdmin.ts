import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useUser } from 'hooks/useUser';
import isSpaceAdmin from 'lib/users/isSpaceAdmin';

export default function isAdmin(spaceId?: string) {
  const space = useCurrentSpace();
  const { user } = useUser();

  return isSpaceAdmin(user, spaceId || space?.id);
}
