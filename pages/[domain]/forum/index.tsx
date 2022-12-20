import { useState } from 'react';

import getPageLayout from 'components/common/PageLayout/getLayout';
import { PostDialogProvider } from 'components/forum/components/PostDialog/hooks/usePostDialog';
import PostDialogGlobal from 'components/forum/components/PostDialog/PostDialogGlobal';
import ForumPageComponent from 'components/forum/ForumPage';
import { useIsCharmverseSpace } from 'hooks/useIsCharmverseSpace';
import { setTitle } from 'hooks/usePageTitle';
import type { PaginatedPostList } from 'lib/forums/posts/listForumPosts';
import type { Member } from 'lib/members/interfaces';

export default function ForumPage() {
  setTitle('Forum');
  const isCharmVerseSpace = useIsCharmverseSpace();
  const [posts, setPosts] = useState<PaginatedPostList<{ user?: Member }> | null>(null);

  // Show this page only to charmverse users
  if (!isCharmVerseSpace) {
    return null;
  }

  return (
    <PostDialogProvider>
      <ForumPageComponent posts={posts} setPosts={setPosts} />
      <PostDialogGlobal setPosts={setPosts} />
    </PostDialogProvider>
  );
}

ForumPage.getLayout = getPageLayout;
