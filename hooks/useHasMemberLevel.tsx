import { useCurrentSpace } from './useCurrentSpace';
import { useSpaces } from './useSpaces';
import { useUser } from './useUser';

type MemberLevel = 'admin' | 'member' | 'guest';

type MemberLevelOutput = {
  hasAccess: boolean | null;
  isLoadingAccess: boolean;
};

export function useHasMemberLevel(level: MemberLevel): MemberLevelOutput {
  const space = useCurrentSpace();
  const { isLoaded: isSpacesLoaded, spaces } = useSpaces();
  const { user, isLoaded: isUserLoaded } = useUser();

  if (
    !isUserLoaded ||
    !isSpacesLoaded ||
    // This condition is required for the interim state where the user has the spaces loaded, but the space has not yet been set
    // We assert a condition of having at least one space in the array to avoid impacting users without a space
    (spaces.length > 0 && !space)
  ) {
    return { hasAccess: null, isLoadingAccess: true };
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
