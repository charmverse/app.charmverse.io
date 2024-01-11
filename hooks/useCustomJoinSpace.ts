import { useCallback, useEffect, useRef, useState } from 'react';

import { useVerifyCustomJoinSpace } from 'charmClient/hooks/spaces';
import { useCharmRouter } from 'hooks/useCharmRouter';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useIsSpaceMember } from 'hooks/useIsSpaceMember';
import { useSpaces } from 'hooks/useSpaces';
import { useUser } from 'hooks/useUser';

const customJoinRoutes = ['/[domain]/proposals/new'];

export function useCustomJoinSpace() {
  const { router } = useCharmRouter();
  const { user, isLoaded: isUserLoaded } = useUser();
  const { isSpaceMember } = useIsSpaceMember();
  const { space } = useCurrentSpace();

  const [accessChecked, setAccessChecked] = useState(!!isSpaceMember);
  const { trigger: tryJoinSpace } = useVerifyCustomJoinSpace(space?.id);

  const isCheckingRef = useRef(false);

  const verifyCustomJoin = useCallback(async () => {
    if (isCheckingRef.current) {
      return;
    }

    if (router.pathname === '/[domain]/proposals/new') {
      const { template } = router.query;

      if (!space || !template || typeof template !== 'string') {
        return;
      }

      try {
        isCheckingRef.current = true;

        const joinedSpace = await tryJoinSpace({ proposalTemplate: template });
        if (joinedSpace) {
          router.reload();
        }
        setAccessChecked(true);
      } catch (error) {
        // not allowed to join
        setAccessChecked(true);
      } finally {
        isCheckingRef.current = false;
      }
    }
  }, [router, space, tryJoinSpace]);

  useEffect(() => {
    if (space?.id || user?.id) {
      setAccessChecked(false);
    }
  }, [space?.id, user?.id]);

  useEffect(() => {
    if (!isUserLoaded) {
      return;
    }

    if (isSpaceMember || !user) {
      setAccessChecked(true);
      return;
    }

    if (customJoinRoutes.includes(router.pathname) && !isCheckingRef.current) {
      verifyCustomJoin();
    } else {
      setAccessChecked(true);
    }
  }, [accessChecked, isUserLoaded, isSpaceMember, router, user, verifyCustomJoin]);

  return { accessChecked };
}
