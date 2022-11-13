
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useUser } from 'hooks/useUser';
import isSpaceAdmin from 'lib/users/isSpaceAdmin';

export default function isAdmin () {

  const space = useCurrentSpace();
  const { user } = useUser();

  return isSpaceAdmin(user, space?.id);
}
