import { useCurrentSpace } from './useCurrentSpace';
import { useUser } from './useUser';

type MemberLevel = 'admin' | 'member' | 'guest';

export function useHasMemberLevel(level: MemberLevel) {
  const space = useCurrentSpace();
  const { user } = useUser();

  if (!space || !user) {
    return false;
  }

  const spaceRole = user.spaceRoles.find((sr) => sr.spaceId === space.id);

  if (!spaceRole) {
    return false;
  }

  if (level === 'admin') {
    return spaceRole.isAdmin === true;
  } else if (level === 'member') {
    return !spaceRole.isGuest;
  } else {
    // As long as there is a space role, we're ok
    return !!spaceRole;
  }
}
