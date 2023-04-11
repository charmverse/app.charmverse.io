import { useState } from 'react';
import useSWR from 'swr';

import charmClient from 'charmClient';
import type { SystemError } from 'lib/utilities/errors';

import { usePostPermissions } from '../../../hooks/usePostPermissions';

type Props = {
  postPath: string;
  spaceDomain: string;
};

/**
 * This hook allows accessing post data and permissions in contexts where we only have path data (such as in the header)
 */
export function usePostByPath({ spaceDomain, postPath }: Props) {
  const [error, setError] = useState<SystemError | null>(null);

  const { data: forumPost } = useSWR(spaceDomain && postPath ? `post-${spaceDomain}-${postPath}` : null, () =>
    charmClient.forum
      .getForumPost({ postIdOrPath: postPath, spaceDomain })
      .then((res) => {
        setError(null);
        return res;
      })
      .catch((err) => setError(err))
  );

  // Post permissions hook will not make an API call if post ID is null.
  const permissions = usePostPermissions({ postIdOrPath: forumPost?.id as string });

  return {
    forumPost,
    permissions,
    error
  };
}
