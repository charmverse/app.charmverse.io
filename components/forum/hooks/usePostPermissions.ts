import useSWR from 'swr';

import charmClient from 'charmClient';
import { AvailablePostPermissions } from 'lib/permissions/forum/availablePostPermissions.class';

export function usePostPermissions(postId: string) {
  const { data } = useSWR(
    !postId ? null : `compute-post-category-permissions-${postId}`,
    () => charmClient.permissions.computePostPermissions(postId),
    {
      fallbackData: new AvailablePostPermissions().empty
    }
  );

  return { permissions: data };
}
