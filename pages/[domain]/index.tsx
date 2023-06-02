import type { Page } from '@charmverse/core/prisma';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

import { filterVisiblePages } from 'components/common/PageLayout/components/PageNavigation/PageNavigation';
import { LoginPageView } from 'components/login/LoginPage';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { getKey } from 'hooks/useLocalStorage';
import { usePages } from 'hooks/usePages';
import { useUser } from 'hooks/useUser';
import { sortNodes } from 'lib/pages/mapPageTree';
import { getSubdomainPath } from 'lib/utilities/browser';

// Redirect users to an initial page
export default function RedirectToMainPage() {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const space = useCurrentSpace();
  const { pages, loadingPages } = usePages();
  const defaultPageKey: string = space?.domain ? getKey(`last-page-${space.domain}`) : '';
  const defaultPage = defaultPageKey ? typeof window !== 'undefined' && localStorage.getItem(defaultPageKey) : null;
  const staticCommonPages = ['bounties', 'members', 'proposals'];

  // Non-logged in users should see the login page
  const returnUrl = router.query.returnUrl as string | undefined;
  const showLogin = (isLoaded && !user) || returnUrl;

  useEffect(() => {
    if (showLogin) {
      return;
    }

    const isCommonDefaultPage = defaultPage && staticCommonPages.some((page) => defaultPage.includes(`/${page}`));
    const isDynamicDefaultPage =
      !isCommonDefaultPage &&
      defaultPage &&
      Object.values(pages).some((page) => page && defaultPage.includes(`/${page.path}`));
    if (isCommonDefaultPage || isDynamicDefaultPage) {
      router.push(defaultPage);
    } else if (!loadingPages) {
      // Find the first top-level page that is not card and hasn't been deleted yet.
      const topLevelPages = filterVisiblePages(pages)
        // Remove any child pages (eg. that have a parentId)
        .filter((page) => !page?.parentId);

      const sortedPages = sortNodes(topLevelPages);

      const firstPage = sortedPages[0] as Page;

      // make sure this page is part of this space in case user is navigating to a new space
      if (firstPage && space && firstPage?.spaceId === space.id) {
        const redirectPath = getSubdomainPath(`/${space.domain}/${firstPage.path}`, space ?? undefined);
        router.push(redirectPath);
      } else if (space && sortedPages.length === 0) {
        const redirectPath = getSubdomainPath(`/${space.domain}/members`, space ?? undefined);
        router.push(redirectPath);
      }
    }
  }, [space, loadingPages, pages]);

  if (showLogin) {
    return <LoginPageView />;
  }

  return null;
}
