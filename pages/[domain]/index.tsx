import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { usePages } from 'hooks/usePages';

// Redirect users to an initial page
export default function RedirectToMainPage () {
  const router = useRouter();
  const [space] = useCurrentSpace();
  const { pages } = usePages();

  useEffect(() => {

    // Find the first top-level page that is not card and hasn't been deleted yet
    const firstPage = Object.values(pages)
      .find((page) => (page?.type === 'board' || page?.type === 'page')
            && page?.deletedAt === null
            && page?.parentId === null);

    // make sure this page is part of this space in case user is navigating to a new space
    if (space && firstPage?.spaceId === space.id) {
      router.push(`/${space.domain}/${firstPage.path}`);
    }

  }, [space, pages]);

  return null;
}
