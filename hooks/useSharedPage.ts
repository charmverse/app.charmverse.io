import { useRouter } from 'next/router';
import { useMemo } from 'react';
import useSWR from 'swr';

import charmClient from 'charmClient';
import { useSpaces } from 'hooks/useSpaces';

const BOUNTIES_PATH = '/[domain]/bounties';
const DOCUMENT_PATH = '/[domain]/[pageId]';
const FORUM_PATH = '/[domain]/forum';
const PUBLIC_PAGE_PATHS = [BOUNTIES_PATH, DOCUMENT_PATH, FORUM_PATH];

export const useSharedPage = () => {
  const { pathname, query, isReady: isRouterReady } = useRouter();

  const isPublicPath = isPublicPagePath(pathname);
  const isBountiesPath = isPublicPath && isBountiesPagePath(pathname);
  const isForumPath = isPublicPath && isForumPagePath(pathname);

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

    if (isForumPath) {
      return `${spaceDomain}/forum`;
    }

    return `${spaceDomain}/${pagePath}`;
  }, [isBountiesPagePath, isPublicPath, isForumPath, spaceDomain, pagePath]);

  // user does not have access to space and is page path, so we want to verify if it is a public page
  const shouldLoadPublicPage = useMemo(() => {
    if (!spacesLoaded || !isPublicPath) {
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
    data: space,
    isLoading: isSpaceLoading,
    error: spaceError
  } = useSWR(spaceDomain ? `space/${spaceDomain}` : null, () => charmClient.spaces.searchByDomain(spaceDomain || ''));

  const hasError = !!publicPageError || !!spaceError;
  const hasPublicBounties = space?.publicBountyBoard;
  const hasSharedPageAccess = !!publicPage || !!hasPublicBounties || isForumPagePath(pathname);
  const accessChecked = isRouterReady && !isSpaceLoading && !isPublicPageLoading;

  return {
    accessChecked,
    hasError,
    hasSharedPageAccess,
    publicSpace: space,
    publicPage
  };
};

export function isPublicPagePath(path: string): boolean {
  return PUBLIC_PAGE_PATHS.some((p) => path.startsWith(p));
}

export function isPublicDocumentPath(path: string): boolean {
  return path.startsWith(DOCUMENT_PATH);
}

export function isBountiesPagePath(path: string): boolean {
  return path.startsWith(BOUNTIES_PATH);
}

export function isForumPagePath(path: string): boolean {
  return path.startsWith(FORUM_PATH);
}
