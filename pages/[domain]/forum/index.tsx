import getPageLayout from 'components/common/PageLayout/getLayout';
import ForumPageComponent from 'components/forum/ForumPage';
import { useIsCharmverseSpace } from 'hooks/useIsCharmverseSpace';
import { setTitle } from 'hooks/usePageTitle';

export default function ForumPage() {
  setTitle('Forum');
  const isCharmVerseSpace = useIsCharmverseSpace();

  // Show this page only to charmverse users
  if (!isCharmVerseSpace) {
    return null;
  }

  return <ForumPageComponent />;
}

ForumPage.getLayout = getPageLayout;
