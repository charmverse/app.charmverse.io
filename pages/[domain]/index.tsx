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
    if (firstPageId && space) {
      router.push(`/${space.domain}/${pages[firstPageId].path}`);
    }
  }, [space, pages]);

  return null;
}
