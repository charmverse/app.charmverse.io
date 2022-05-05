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
    // Find the first page that is not card and hasn't been deleted yet
    const firstPageId = Object.values(pages)
      .find((page) => (page?.type === 'board' || page?.type === 'page') && page?.deletedAt === null)?.id;
    if (space && firstPageId) {
      const page = pages[firstPageId];
      if (page) {
        router.push(`/${space.domain}/${page.path}`);
      }
    }
  }, [space, pages]);

  return null;
}
