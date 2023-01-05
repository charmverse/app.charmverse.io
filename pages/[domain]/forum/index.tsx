import getPageLayout from 'components/common/PageLayout/getLayout';
import { PostDialogProvider } from 'components/forum/components/PostDialog/hooks/usePostDialog';
import PostDialogGlobal from 'components/forum/components/PostDialog/PostDialogGlobal';
import { ForumPage } from 'components/forum/ForumPage';
import { useIsCharmverseSpace } from 'hooks/useIsCharmverseSpace';
import { setTitle } from 'hooks/usePageTitle';

export default function ForumPageComponent() {
  setTitle('Forum');
  const isCharmVerseSpace = useIsCharmverseSpace();

  // Show this page only to charmverse users
  if (!isCharmVerseSpace) {
    return null;
  }

  return (
    <PostDialogProvider>
      <ForumPage />
      <PostDialogGlobal />
    </PostDialogProvider>
  );
}

ForumPageComponent.getLayout = getPageLayout;
