import { useRouter } from 'next/router';
import { useState } from 'react';
import useSWR from 'swr';

import charmClient from 'charmClient';
import type { SystemError } from 'lib/utilities/errors';

import { usePostPermissions } from '../../../hooks/usePostPermissions';

/**
 * This hook allows accessing post data and permissions in contexts where we only have path data (such as in the header)
 */
export function usePostByPath() {
  const [error, setError] = useState<SystemError | null>(null);
  const router = useRouter();
  const isForumPost = router.route === '/[domain]/forum/post/[pagePath]';
  const postPath = isForumPost ? (router.query.pagePath as string) : null;
  const spaceDomain = router.query.domain as string;

  const { data: forumPost } = useSWR(spaceDomain && postPath ? `post-${spaceDomain}-${postPath}` : null, () =>
    charmClient.forum
      .getForumPost({ postIdOrPath: postPath as string, spaceDomain })
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
