import { useCurrentSpace } from './useCurrentSpace';
import { useUser } from './useUser';

type MemberLevel = 'admin' | 'member' | 'guest';

type MemberLevelOutput = {
  hasAccess?: boolean;
  isLoadingAccess: boolean;
};

export function useHasMemberLevel(level: MemberLevel): MemberLevelOutput {
  const { space, isLoading: isSpaceLoading } = useCurrentSpace();
  const { user, isLoaded: isUserLoaded } = useUser();
  if (!isUserLoaded || isSpaceLoading) {
    return { isLoadingAccess: true };
  }

  if (!space || !user) {
    return {
      hasAccess: false,
      isLoadingAccess: false
    };
  }

  const spaceRole = user.spaceRoles.find((sr) => sr.spaceId === space.id);

  if (!spaceRole) {
    return {
      hasAccess: false,
      isLoadingAccess: false
    };
  }

  if (level === 'admin') {
    return {
      hasAccess: spaceRole.isAdmin === true,
      isLoadingAccess: false
    };
  } else if (level === 'member') {
    return {
      hasAccess: !spaceRole.isGuest,
      isLoadingAccess: false
    };
  } else {
    // As long as there is a space role, we're ok
    return {
      hasAccess: !!spaceRole,
      isLoadingAccess: false
    };
  }
}
