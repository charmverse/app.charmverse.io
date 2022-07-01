import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { usePages } from 'hooks/usePages';
import { mapTree, filterVisiblePages } from 'components/common/PageLayout/components/PageNavigation/PageNavigation';

// Redirect users to an initial page
export default function RedirectToMainPage () {
  const router = useRouter();
  const [space] = useCurrentSpace();
  const { pages } = usePages();

  useEffect(() => {

    // Find the first top-level page that is not card and hasn't been deleted yet.
    const pageArray = filterVisiblePages(Object.values(pages))
      // Optimize a bit by removing any child pages (eg. that have a parentId)
      .filter(page => !page?.parentId);
    const pageTree = mapTree(pageArray);
    const firstPage = pageTree[0];

    // make sure this page is part of this space in case user is navigating to a new space
    if (firstPage && space && pageArray[0]?.spaceId === space.id) {
      router.push(`/${space.domain}/${firstPage.path}`);
    }

  }, [space, pages]);

  return null;
}
