import type { Post } from '@prisma/client';
import { useEffect, useState } from 'react';

import charmClient from 'charmClient';
import type { PostWithVotes } from 'lib/forums/posts/interfaces';
import log from 'lib/log';

import { usePostDialog } from './hooks/usePostDialog';
import PostDialog from './PostDialog';

// a wrapper of page dialog that uses usePageDialogHook
export default function PostDialogGlobal() {
  const [post, setPost] = useState<PostWithVotes | null>(null);
  const { props, hidePost } = usePostDialog();
  const { postId } = props;

  function closeDialog() {
    hidePost();
  }

  useEffect(() => {
    if (postId) {
      charmClient.forum
        .getForumPost(postId)
        .then((_post) => {
          setPost(_post);
        })
        .catch((error) => {
          log.error('Could not load page', error);
        });
    } else {
      setPost(null);
    }
  }, [postId]);

  return post ? <PostDialog key={post.id} post={post} onClose={closeDialog} spaceId={post.spaceId} /> : null;
}
