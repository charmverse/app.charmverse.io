import { useRouter } from 'next/router';
import { useMemo } from 'react';
import useSWR from 'swr';

import charmClient from 'charmClient';
import { isBountiesPagePath, isPublicPagePath } from 'components/publicPages/utils';
import { useSpaces } from 'hooks/useSpaces';

export const usePublicPage = () => {
  const { pathname, query } = useRouter();

  const isPublicPath = isPublicPagePath(pathname);
  const isBountiesPath = isPublicPath && isBountiesPagePath(pathname);

  const { spaces, isLoaded: spacesLoaded } = useSpaces();
  const spaceDomain = isPublicPath ? (query.domain as string) : null;
  const loadedSpace = spaces.find((s) => s.domain === spaceDomain);
  const pagePath = isPublicPath && !isBountiesPath ? (query.pageId as string) : null;

  const pageKey = useMemo(() => {
    if (!isPublicPath) {
      return null;
    }

    if (isBountiesPath) {
      return `${spaceDomain}/bounties`;
    }

    return `${spaceDomain}/${pagePath}`;
  }, [isBountiesPagePath, isPublicPath, spaceDomain, pagePath]);

  // user does not have access to space and is page path, so we want to verify if it is a public page
  const shouldLoadPublicPage = useMemo(() => {
    if (!spacesLoaded || !isPublicPath || isBountiesPath) {
      return false;
    }

    return !loadedSpace;
  }, [spacesLoaded, isPublicPath, spaces, spaceDomain]);

  const shouldLoadSpace = useMemo(() => {
    if (!spacesLoaded || !isBountiesPath) {
      return false;
    }

    return !loadedSpace;
  }, [spacesLoaded, isPublicPath, spaces, spaceDomain]);

  const {
    data: publicPage,
    isLoading: isPublicPageLoading,
    error: publicPageError
  } = useSWR(shouldLoadPublicPage ? `public/${pageKey}` : null, () => charmClient.getPublicPage(pageKey || ''));

  const {
    data: publicSpace,
    isLoading: isSpaceLoading,
    error: spaceError
  } = useSWR(shouldLoadSpace ? `space/${spaceDomain}` : null, () => charmClient.getSpaceByDomain(spaceDomain || ''));

  const space = publicSpace || publicPage?.space;
  const hasPublicBounties = space?.publicBountyBoard;
  const hasPublicPageAccess = !!publicPage || !!hasPublicBounties;
  const accessCheked = spacesLoaded && (hasPublicPageAccess || (!shouldLoadSpace && !shouldLoadPublicPage) || !!space);

  return {
    isCheckingAccess: isPublicPageLoading || isSpaceLoading,
    accessCheked,
    hasError: !!publicPageError || !!spaceError,
    hasPublicPageAccess: !!publicPage || !!hasPublicBounties,
    publicSpace: space,
    publicPage
  };
};
