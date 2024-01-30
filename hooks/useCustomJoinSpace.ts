import { useCallback } from 'react';

import { useVerifyCustomJoinSpace } from 'charmClient/hooks/spaces';
import { useCharmRouter } from 'hooks/useCharmRouter';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useUser } from 'hooks/useUser';

export function useCustomJoinSpace() {
  const { router } = useCharmRouter();
  const { refreshUser } = useUser();

  const { space } = useCurrentSpace();

  const { trigger: tryJoinSpace } = useVerifyCustomJoinSpace(space?.id);

  const verifyCustomJoin = useCallback(
    async ({ proposalTemplate }: { proposalTemplate: string }) => {
      await tryJoinSpace({ proposalTemplate });
      // Refresh user roles
      await refreshUser();
    },
    [router, space, tryJoinSpace]
  );

  return { verifyCustomJoin };
}
