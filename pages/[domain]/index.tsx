import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { usePages } from 'hooks/usePages';

export default function IndexPage () {
  const router = useRouter();
  const [space] = useCurrentSpace();
  const { pages } = usePages();

  useEffect(() => {
    if (pages.length > 0 && space) {
      router.push(`/${space.domain}/${pages[0].path}`);
    }
  }, [space, pages]);

  return null;
}
