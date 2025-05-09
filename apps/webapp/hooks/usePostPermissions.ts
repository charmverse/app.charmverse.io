import { AvailablePostPermissions } from '@charmverse/core/permissions/flags';
import useSWR from 'swr';

import charmClient from 'charmClient';

type Props = {
  postIdOrPath?: string;
  spaceDomain?: string;
  isNewPost?: boolean;
};

export function usePostPermissions({ postIdOrPath, spaceDomain, isNewPost }: Props) {
  const { data } = useSWR(
    !postIdOrPath ? null : `compute-post-category-permissions-${postIdOrPath}${spaceDomain ?? ''}`,
    () =>
      charmClient.permissions.forum.computePostPermissions({
        postIdOrPath: postIdOrPath!,
        spaceDomain
      })
  );

  if (isNewPost) {
    return new AvailablePostPermissions().full;
  }

  return data;
}
