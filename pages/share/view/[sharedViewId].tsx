import { useRouter } from 'next/router';
import { generatePath } from 'lib/utilities/strings';
import PageView from '../[...pageId]';

export default function PublicBoardView () {
  const router = useRouter();

  const { sharedViewId } = router.query;

  const { viewId } = router.query;

  if (!viewId) {
    const newPath = generatePath(router.pathname, { ...router.query, sharedViewId });
    router.replace({
      pathname: newPath,
      query: { viewId: sharedViewId }
    });
    return null;
  }

  return <PageView />;
}
