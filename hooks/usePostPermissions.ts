import useSWR from 'swr';

import charmClient from 'charmClient';
import { AvailablePostPermissions } from 'lib/permissions/forum/availablePostPermissions.class';

type Props = {
  postIdOrPath: string;
  spaceDomain?: string;
  isNewPost?: boolean;
};

export function usePostPermissions({ postIdOrPath, spaceDomain, isNewPost }: Props) {
  const { data } = useSWR(
    !postIdOrPath ? null : `compute-post-category-permissions-${postIdOrPath}${spaceDomain ?? ''}`,
    () =>
      charmClient.permissions.forum.computePostPermissions({
        postIdOrPath,
        spaceDomain
      })
  );

  if (isNewPost) {
    return new AvailablePostPermissions().full;
  }

  return data;
}
