import { log } from '@charmverse/core/log';
import { useEffect, useState } from 'react';

import charmClient from 'charmClient';
import type { PostWithVotes } from '@packages/lib/forums/posts/interfaces';

import { usePostDialog } from './hooks/usePostDialog';
import { PostDialog } from './PostDialog';

// a wrapper of page dialog that uses usePageDialogHook
export default function PostDialogGlobal() {
  const [post, setPost] = useState<PostWithVotes | null>(null);
  const { props, hidePost } = usePostDialog();
  const { newPost, postId } = props;

  useEffect(() => {
    if (postId) {
      charmClient.forum
        .getForumPost({ postIdOrPath: postId })
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

  // include postId: when creating a draft, the dialog is open due to 'newPost' being set.
  // once we save it, we need to load it as 'post' but keep the dialog open in the meantime
  if (newPost || post || postId) {
    return (
      <PostDialog
        isLoading={!post && !newPost}
        post={post}
        newPostCategory={newPost?.category}
        onClose={hidePost}
        spaceId={post?.spaceId || newPost?.spaceId}
      />
    );
  }
  return null;
}
