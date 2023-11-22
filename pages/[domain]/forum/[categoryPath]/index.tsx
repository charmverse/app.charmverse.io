import { useTrackPageView } from 'charmClient/hooks/track';
import getPageLayout from 'components/common/PageLayout/getLayout';
import { PostDialogProvider } from 'components/forum/components/PostDialog/hooks/usePostDialog';
import PostDialogGlobal from 'components/forum/components/PostDialog/PostDialogGlobal';
import { ForumPage } from 'components/forum/ForumFeedPage';

export default function ForumPageComponent() {
  useTrackPageView({ type: 'forum_posts_list' });
  return (
    <PostDialogProvider>
      <ForumPage />
      <PostDialogGlobal />
    </PostDialogProvider>
  );
}

ForumPageComponent.getLayout = getPageLayout;
