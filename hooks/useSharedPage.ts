import { useRouter } from 'next/router';
import { useMemo } from 'react';
import useSWR from 'swr';

import charmClient from 'charmClient';
import { useSpaces } from 'hooks/useSpaces';

const BOUNTIES_PATH = '/[domain]/bounties';
const PUBLIC_PAGE_PATHS = [BOUNTIES_PATH, '/[domain]/[pageId]'];

export const useSharedPage = () => {
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
  const hasError = !!publicPageError || !!spaceError;
  const hasPublicBounties = space?.publicBountyBoard;
  const hasSharedPageAccess = !!publicPage || !!hasPublicBounties;
  const accessChecked =
    (spacesLoaded && (hasSharedPageAccess || (!shouldLoadSpace && !shouldLoadPublicPage) || !!space)) || hasError;

  return {
    isCheckingAccess: isPublicPageLoading || isSpaceLoading,
    accessChecked,
    hasError,
    hasSharedPageAccess: !!publicPage || !!hasPublicBounties,
    publicSpace: space,
    publicPage
  };
};

export function isPublicPagePath(path: string): boolean {
  return PUBLIC_PAGE_PATHS.includes(path);
}

export function isBountiesPagePath(path: string): boolean {
  return path === BOUNTIES_PATH;
}
