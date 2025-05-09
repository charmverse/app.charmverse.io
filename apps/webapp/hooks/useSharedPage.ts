import { useRouter } from 'next/router';
import { useMemo } from 'react';
import useSWRImmutable from 'swr/immutable';

import charmClient from 'charmClient';
import { useSearchByDomain } from 'charmClient/hooks/spaces';
import { useSpaces } from 'hooks/useSpaces';
import { filterSpaceByDomain } from 'lib/spaces/filterSpaceByDomain';

const REWARDS_PATH = '/[domain]/rewards';
const PROPOSALS_PATH = '/[domain]/proposals';
const DOCUMENT_PATH = '/[domain]/[pageId]';
const FORUM_PATH = '/[domain]/forum';
const PUBLIC_PAGE_PATHS = [REWARDS_PATH, DOCUMENT_PATH, FORUM_PATH, PROPOSALS_PATH];

type PublicPageType = 'forum' | 'proposals' | 'rewards';

export const useSharedPage = () => {
  const { pathname, query, isReady: isRouterReady } = useRouter();

  const isPublicPath = isPublicPagePath(pathname);
  const isRewardsPath = isPublicPath && isRewardsPagePath(pathname);
  const isForumPath = isPublicPath && isForumPagePath(pathname);
  const isProposalsPath = isPublicPath && isProposalsPagePath(pathname);

  const { spaces, isLoaded: spacesLoaded } = useSpaces();
  const spaceDomain = isPublicPath ? (query.domain as string) : null;
  const loadedSpace = filterSpaceByDomain(spaces, spaceDomain || '');
  const pagePath = isPublicPath && !isRewardsPath ? (query.pageId as string) : null;
  const pageKey = useMemo(() => {
    if (!isPublicPath) {
      return null;
    }

    if (isRewardsPath) {
      return `${spaceDomain}/rewards`;
    }

    if (isForumPath) {
      return `${spaceDomain}/forum`;
    }

    if (isProposalsPath) {
      return `${spaceDomain}/proposals`;
    }

    return `${spaceDomain}/${pagePath}`;
  }, [isRewardsPath, isPublicPath, isForumPath, spaceDomain, pagePath]);

  // user does not have access to space and is page path, so we want to verify if it is a public page
  const shouldLoadPublicPage = useMemo(() => {
    if (!spacesLoaded || !isPublicPath) {
      return false;
    }

    return !loadedSpace;
  }, [spacesLoaded, isPublicPath, loadedSpace]);

  const { data: publicPage, isLoading: isPublicPageLoading } = useSWRImmutable(
    shouldLoadPublicPage ? `public/${pageKey}` : null,
    () => charmClient.getPublicPage(pageKey || '')
  );

  const { data: space, isLoading: isSpaceLoading } = useSearchByDomain(spaceDomain || '');

  const hasPublicRewards = space?.publicBountyBoard || space?.paidTier === 'free';
  const hasPublicProposals = space?.publicProposals || space?.paidTier === 'free';
  const hasSharedPageAccess =
    !!publicPage ||
    (!!hasPublicRewards && isRewardsPagePath(pathname)) ||
    isForumPagePath(pathname) ||
    (!!hasPublicProposals && isProposalsPagePath(pathname));
  const accessChecked = isRouterReady && !isSpaceLoading && !isPublicPageLoading;

  return {
    accessChecked,
    hasSharedPageAccess,
    publicSpace: space,
    isPublicPath,
    publicPage,
    publicPageType: (isRewardsPath
      ? 'rewards'
      : isProposalsPath
        ? 'proposals'
        : isForumPath
          ? 'forum'
          : null) as PublicPageType | null
  };
};

export function isPublicPagePath(path: string): boolean {
  return PUBLIC_PAGE_PATHS.some((p) => path.startsWith(p));
}

export function isPublicDocumentPath(path: string): boolean {
  return path.startsWith(DOCUMENT_PATH);
}

export function isRewardsPagePath(path: string): boolean {
  return path.startsWith(REWARDS_PATH);
}

export function isForumPagePath(path: string): boolean {
  return path.startsWith(FORUM_PATH);
}

export function isProposalsPagePath(path: string): boolean {
  // exclude new proposals for now. Maybe we should allow a sign-up button on the page?
  return path.startsWith(PROPOSALS_PATH) && !path.endsWith('/new');
}
