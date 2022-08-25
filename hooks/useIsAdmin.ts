
import { useUser } from 'hooks/useUser';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import isSpaceAdmin from 'lib/users/isSpaceAdmin';

export default function isAdmin () {

  const [space] = useCurrentSpace();
  const { user } = useUser();

  return isSpaceAdmin(user, space?.id);
}
