import getPageLayout from 'components/common/PageLayout/getLayout';
import ForumPageComponent from 'components/forum/ForumPage';
import { isProdEnv } from 'config/constants';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { setTitle } from 'hooks/usePageTitle';

export default function ForumPage() {
  setTitle('Forum');

  const space = useCurrentSpace();

  // Show this page only to charmverse users
  if (!space?.name.includes('charmverse') && isProdEnv) {
    return null;
  }

  return <ForumPageComponent />;
}

ForumPage.getLayout = getPageLayout;
