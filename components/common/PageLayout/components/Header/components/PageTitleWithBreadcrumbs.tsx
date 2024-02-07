import type { PageMeta } from '@charmverse/core/pages';
import type { PageType } from '@charmverse/core/prisma';
import styled from '@emotion/styled';
import { Box, Typography, CircularProgress } from '@mui/material';
import { useRouter } from 'next/router';
import type { ReactNode } from 'react';

import { useGetApplication, useGetReward } from 'charmClient/hooks/rewards';
import Link from 'components/common/Link';
import { usePostByPath } from 'components/forum/hooks/usePostByPath';
import { useCharmEditor } from 'hooks/useCharmEditor';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useForumCategories } from 'hooks/useForumCategories';
import { usePages } from 'hooks/usePages';
import { usePageTitle } from 'hooks/usePageTitle';
import { useSpaceFeatures } from 'hooks/useSpaceFeatures';
import type { PostWithVotes } from 'lib/forums/posts/interfaces';

import { PageIcon } from '../../../../PageIcon';

export const BreadCrumb = styled.span`
  display: none;

  ${({ theme }) => theme.breakpoints.up('md')} {
    display: inline-flex;
  }

  :after {
    content: ' / ';
    opacity: 0.5;
    margin-left: 0.5em;
    margin-right: 0.5em;
  }
  a {
    color: inherit;
  }
`;

const StyledPageIcon = styled(PageIcon)`
  cursor: inherit;
  display: inline;
  // this is to vertically center images
  img {
    position: relative;
    top: 3px;
  }
`;

const StyledPageTitle = styled(Typography)`
  font-size: 0.9rem;
  text-overflow: ellipsis;
  max-width: 500px;
` as typeof Typography;

export function BreadcrumbPageTitle({ children, sx = {} }: { children: ReactNode; sx?: object }) {
  return (
    <StyledPageTitle noWrap component='div' sx={sx}>
      {children}
    </StyledPageTitle>
  );
}

interface PageBreadCrumb {
  path?: null | string;
  icon: string | null;
  title: string;
}

function DocumentPageTitle({
  basePath,
  pageId,
  pageMeta
}: {
  basePath: string;
  pageId?: string;
  pageMeta?: Pick<PageMeta, 'title' | 'icon' | 'parentId'>;
}) {
  const { pages } = usePages();
  const { isSaving } = useCharmEditor();

  const currentPage = (pageId ? pages[pageId] : undefined) ?? pageMeta;

  // find parent pages
  let activePage = currentPage;
  const breadcrumbs: PageBreadCrumb[] = [];
  while (activePage?.parentId) {
    activePage = pages[activePage.parentId];
    if (activePage) {
      breadcrumbs.unshift(activePage);
    }
  }

  const collapsedCrumb = {
    title: '...',
    path: null,
    icon: null
  };
  const trimBreadcrumbs = breadcrumbs.length > 2;
  const displayedCrumbs = trimBreadcrumbs
    ? [breadcrumbs[0], collapsedCrumb, breadcrumbs[breadcrumbs.length - 1]]
    : breadcrumbs;

  return (
    <Box display='flex'>
      {displayedCrumbs.map((crumb) => (
        <BreadCrumb key={crumb.path}>
          {crumb.path ? (
            <Link href={`${basePath}/${crumb.path}`}>
              <BreadcrumbPageTitle sx={{ maxWidth: 160 }}>
                {crumb.icon && <StyledPageIcon icon={crumb.icon} />}
                {crumb.title || 'Untitled'}
              </BreadcrumbPageTitle>
            </Link>
          ) : (
            <BreadcrumbPageTitle>{crumb.title}</BreadcrumbPageTitle>
          )}
        </BreadCrumb>
      ))}
      {currentPage && (
        <BreadcrumbPageTitle sx={{ maxWidth: 240 }}>
          {currentPage.icon && <StyledPageIcon icon={currentPage.icon} />}
          {currentPage.title || 'Untitled'}
        </BreadcrumbPageTitle>
      )}
      {isSaving && (
        <Box display='inline-flex' alignItems='center' gap={1} ml={2}>
          <CircularProgress size={12} />
          <Typography variant='subtitle2'>Saving</Typography>
        </Box>
      )}
    </Box>
  );
}

function ProposalPageTitle({ basePath, sectionName }: { basePath: string; sectionName: string }) {
  const [pageTitle] = usePageTitle();
  return (
    <BreadcrumbPageTitle>
      <BreadCrumb>
        <Link href={`${basePath}/proposals`}>{sectionName}</Link>
      </BreadCrumb>
      {pageTitle || 'Untitled'}
    </BreadcrumbPageTitle>
  );
}

function ForumPostTitle({
  basePath,
  pathName,
  sectionName,
  post
}: {
  basePath: string;
  pathName: string;
  sectionName: string;
  post?: PostWithVotes | null;
}) {
  const [pageTitle] = usePageTitle();
  const title = pathName === '/[domain]/forum' ? 'All Categories' : pageTitle;

  // get category context for individual posts
  const forumPostInfo = usePostByPath();
  const { getForumCategoryById } = useForumCategories();
  const category = getForumCategoryById(forumPostInfo.forumPost?.categoryId);
  return (
    <BreadcrumbPageTitle>
      <BreadCrumb>
        <Link href={`${basePath}/forum`}>{sectionName}</Link>
      </BreadCrumb>
      {category && (
        <BreadCrumb>
          <Link href={`${basePath}/forum/${category.path}`}>{category.name}</Link>
        </BreadCrumb>
      )}
      {title ?? 'Untitled'}
    </BreadcrumbPageTitle>
  );
}

function RewardsPageTitle({
  basePath,
  sectionName,
  applicationId
}: {
  basePath: string;
  sectionName: string;
  applicationId?: string;
}) {
  const [pageTitle] = usePageTitle();
  const { data: application } = useGetApplication({ applicationId });
  const { data: rewardWithPageMeta } = useGetReward({ rewardId: application?.bountyId });

  return (
    <BreadcrumbPageTitle>
      <BreadCrumb>
        <Link href={`${basePath}/rewards`}>{sectionName}</Link>
      </BreadCrumb>
      {pageTitle && !applicationId ? pageTitle : null}
      {rewardWithPageMeta && (
        <>
          <BreadCrumb>
            <Link href={`${basePath}/${rewardWithPageMeta.page.path}`}>{rewardWithPageMeta.page.title}</Link>
          </BreadCrumb>
          {applicationId && 'Application'}
        </>
      )}
    </BreadcrumbPageTitle>
  );
}
function PublicBountyPageTitle() {
  const { space } = useCurrentSpace();
  return (
    <BreadcrumbPageTitle>
      {space && (
        <>
          <BreadCrumb>{`${space.name}`}</BreadCrumb>
          Rewards
        </>
      )}
    </BreadcrumbPageTitle>
  );
}

function DefaultPageTitle() {
  const [pageTitle] = usePageTitle();
  return <BreadcrumbPageTitle>{pageTitle}</BreadcrumbPageTitle>;
}

export function PageTitleWithBreadcrumbs({
  pageId,
  pageMeta,
  pageType,
  post
}: {
  pageId?: string;
  pageMeta?: Pick<PageMeta, 'title' | 'icon' | 'parentId'>; // pass in page meta in case the page is in the trash, in which case it won't be in the pages map
  pageType?: PageType;
  post?: PostWithVotes | null;
}) {
  const router = useRouter();
  const { mappedFeatures } = useSpaceFeatures();

  if (router.route === '/share/[...pageId]' && router.query?.pageId?.[1] === 'bounties') {
    return <PublicBountyPageTitle />;
  } else if (pageType === 'bounty' || router.route.startsWith('/[domain]/rewards/')) {
    const sectionName = mappedFeatures.rewards.title;
    return (
      <RewardsPageTitle
        basePath={`/${router.query.domain}`}
        sectionName={sectionName}
        applicationId={router.query.applicationId as string}
      />
    );
  } else if (
    pageType === 'proposal' ||
    pageType === 'proposal_template' ||
    router.route === '/[domain]/proposals/new'
  ) {
    const sectionName = mappedFeatures.proposals.title;
    return <ProposalPageTitle basePath={`/${router.query.domain}`} sectionName={sectionName} />;
  } else if (router.route === '/[domain]/[pageId]') {
    return <DocumentPageTitle basePath={`/${router.query.domain}`} pageId={pageId} pageMeta={pageMeta} />;
  } else if (router.route.includes('/[domain]/forum')) {
    const sectionName = mappedFeatures.forum.title;
    return (
      <ForumPostTitle
        basePath={`/${router.query.domain}`}
        post={post}
        pathName={router.pathname}
        sectionName={sectionName}
      />
    );
  } else if (router.route === '/share/[...pageId]') {
    return <DocumentPageTitle basePath={`/share/${router.query.domain}`} pageId={pageId} />;
  } else {
    return <DefaultPageTitle />;
  }
}
