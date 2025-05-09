import { useTrackPageView } from 'charmClient/hooks/track';
import getPageLayout from 'components/common/PageLayout/getLayout';
import { PostDialogProvider } from 'components/forum/components/PostDialog/hooks/usePostDialog';
import PostDialogGlobal from 'components/forum/components/PostDialog/PostDialogGlobal';
import { ForumPage } from 'components/forum/ForumFeedPage';
import { useStaticPageTitle } from 'hooks/usePageTitle';
import { useSpaceFeatures } from 'hooks/useSpaceFeatures';

export default function ForumPageComponent() {
  const { mappedFeatures } = useSpaceFeatures();
  const forumTitle = mappedFeatures.forum.title;
  useTrackPageView({ type: 'forum_posts_list' });

  useStaticPageTitle(forumTitle);

  return (
    <PostDialogProvider>
      <ForumPage />
      <PostDialogGlobal />
    </PostDialogProvider>
  );
}

ForumPageComponent.getLayout = getPageLayout;
