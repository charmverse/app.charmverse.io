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
    const firstPageId = Object.keys(pages)[0];
    const page = pages[firstPageId];
    if (space && page) {
      router.push(`/${space.domain}/${page.path}`);
    }
  }, [space, pages]);

  return null;
}
