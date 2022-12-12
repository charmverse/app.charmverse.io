import { useEffect, useState } from 'react';

import charmClient from 'charmClient';
import type { ForumPostPageWithoutVote } from 'lib/forums/posts/interfaces';
import log from 'lib/log';

import { usePostDialog } from './hooks/usePostDialog';
import PostDialog from './PostDialog';

// a wrapper of page dialog that uses usePageDialogHook
export default function PostDialogGlobal() {
  const [page, setPage] = useState<ForumPostPageWithoutVote | null>(null);
  const { props, hidePost } = usePostDialog();
  const { postId } = props;

  function closeDialog() {
    hidePost();
  }

  useEffect(() => {
    if (postId) {
      charmClient.forum
        .getForumPost(postId)
        .then((_page) => {
          setPage(_page);
        })
        .catch((error) => {
          log.error('Could not load page', error);
        });
    } else {
      setPage(null);
    }
  }, [postId]);

  return page ? <PostDialog page={page} onClose={closeDialog} /> : null;
}
