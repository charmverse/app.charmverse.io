import type { Dispatch, SetStateAction } from 'react';
import { useEffect, useState } from 'react';

import charmClient from 'charmClient';
import type { ForumPostPage } from 'lib/forums/posts/interfaces';
import type { PaginatedPostList } from 'lib/forums/posts/listForumPosts';
import log from 'lib/log';
import type { Member } from 'lib/members/interfaces';

import { usePostDialog } from './hooks/usePostDialog';
import PostDialog from './PostDialog';

// a wrapper of page dialog that uses usePageDialogHook
export default function PostDialogGlobal({
  setPosts
}: {
  setPosts: Dispatch<
    SetStateAction<PaginatedPostList<{
      user?: Member | undefined;
    }> | null>
  >;
}) {
  const [page, setPage] = useState<ForumPostPage | null>(null);
  const { props, hidePost } = usePostDialog();
  const { postId } = props;

  async function closeDialog() {
    if (postId) {
      // Fetch the post again after closing the dialog to update it in the post list
      const fetchedPost = await charmClient.forum.getForumPost(postId);
      setPosts((posts) => {
        return posts
          ? {
              ...posts,
              data: posts.data.map((post) => (post.id === postId ? fetchedPost : post))
            }
          : null;
      });
    }

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
