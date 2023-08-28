import getPageLayout from 'components/common/PageLayout/getLayout';
import { PostDialogProvider } from 'components/forum/components/PostDialog/hooks/usePostDialog';
import PostDialogGlobal from 'components/forum/components/PostDialog/PostDialogGlobal';
import { ForumPage } from 'components/forum/ForumFeedPage';
import { useFeaturesAndMembers } from 'hooks/useFeaturesAndMemberProfiles';
import { setTitle } from 'hooks/usePageTitle';

export default function ForumPageComponent() {
  const { features } = useFeaturesAndMembers();
  const forumTitle = features.find((f) => f.id === 'forum')?.title || 'Forum';

  setTitle(forumTitle);

  return (
    <PostDialogProvider>
      <ForumPage />
      <PostDialogGlobal />
    </PostDialogProvider>
  );
}

ForumPageComponent.getLayout = getPageLayout;
