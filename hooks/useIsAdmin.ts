import isSpaceAdmin from '@packages/users/isSpaceAdmin';

import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useUser } from 'hooks/useUser';

export function useIsAdmin() {
  const { space } = useCurrentSpace();
  const { user } = useUser();
  return isSpaceAdmin(user, space?.id);
}
