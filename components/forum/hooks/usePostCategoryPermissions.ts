import useSWR from 'swr';

import charmClient from 'charmClient';
import { AvailablePostCategoryPermissions } from 'lib/permissions/forum/availablePostCategoryPermissions.class';

export function usePostCategoryPermissions(postCategoryId: string) {
  const { data } = useSWR(
    !postCategoryId ? null : `compute-post-category-permissions-${postCategoryId}`,
    () => charmClient.permissions.computePostCategoryPermissions(postCategoryId),
    {
      fallbackData: new AvailablePostCategoryPermissions().empty
    }
  );

  return { permissions: data };
}
