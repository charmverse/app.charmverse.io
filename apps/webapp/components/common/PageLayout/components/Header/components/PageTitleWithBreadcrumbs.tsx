import type { PageType } from '@charmverse/core/prisma';
import LockIcon from '@mui/icons-material/Lock';
import { styled, Box, Typography, CircularProgress, Tooltip } from '@mui/material';
import { useRouter } from 'next/router';
import type { ReactNode } from 'react';

import { useGetPageMeta } from 'charmClient/hooks/pages';
import { useGetApplication, useGetReward } from 'charmClient/hooks/rewards';
import Link from 'components/common/Link';
import { usePostByPath } from 'components/forum/hooks/usePostByPath';
import { useCharmEditor } from 'hooks/useCharmEditor';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useForumCategories } from 'hooks/useForumCategories';
import { usePages } from 'hooks/usePages';
import { usePageTitle } from 'hooks/usePageTitle';
import { useSpaceFeatures } from 'hooks/useSpaceFeatures';
import type { PageMeta } from 'lib/pages/interfaces';

import { PageIcon } from '../../../../PageIcon';

export const BreadCrumb = styled('span')`
  display: none;

  ${({ theme }) => theme.breakpoints.up('md')} {
    display: inline-flex;
  }

  :after {
    content: ' / ';
    opacity: 0.5;
    margin-left: 0.5em;
    margin-right: 0.5em;
    line-height: 18px;
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
  svg {
    font-size: 20px;
  }
`;

const StyledPageTitle = styled(Typography)`
  font-size: 0.9rem;
  text-overflow: ellipsis;
  max-width: 500px;
  display: flex;
  align-items: center;
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
  pageId,
  pageMeta
}: {
  pageId?: string;
  pageMeta?: Pick<PageMeta, 'title' | 'icon' | 'parentId' | 'isLocked'>;
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
            <Link href={`/${crumb.path}`}>
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
          {pageMeta?.isLocked ? (
            <Tooltip placement='right' title='This page is locked and cannot be edited'>
              <LockIcon color='secondary' sx={{ ml: 1 }} fontSize='small' />
            </Tooltip>
          ) : null}
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

function ProposalPageTitle({ sectionName }: { sectionName: string }) {
  const [pageTitle] = usePageTitle();
  return (
    <Box display='flex'>
      <BreadCrumb>
        <Link href='/proposals'>
          <BreadcrumbPageTitle>
            <StyledPageIcon pageType='proposal' />
            {sectionName}
          </BreadcrumbPageTitle>
        </Link>
      </BreadCrumb>
      <BreadcrumbPageTitle>{pageTitle || 'Untitled'}</BreadcrumbPageTitle>
    </Box>
  );
}

function ReviewerNotesPageTitle({ parentId, sectionName }: { parentId?: string | null; sectionName: string }) {
  const [pageTitle] = usePageTitle();
  const { data: proposalPage } = useGetPageMeta(parentId);
  return (
    <Box display='flex'>
      <BreadCrumb>
        <Link href='/proposals'>
          <BreadcrumbPageTitle>
            <StyledPageIcon pageType='proposal' />
            {sectionName}
          </BreadcrumbPageTitle>
        </Link>
      </BreadCrumb>
      <BreadCrumb>
        <Link href={`/${proposalPage?.path}`}>
          <BreadcrumbPageTitle sx={{ maxWidth: 160 }}>{proposalPage?.title}</BreadcrumbPageTitle>
        </Link>
      </BreadCrumb>
      <BreadcrumbPageTitle>{pageTitle || 'Untitled'}</BreadcrumbPageTitle>
    </Box>
  );
}

function ForumPostTitle({ pathName, sectionName }: { pathName: string; sectionName: string }) {
  const [pageTitle] = usePageTitle();
  const title = pathName === '/[domain]/forum' ? 'All Categories' : pageTitle;

  // get category context for individual posts
  const forumPostInfo = usePostByPath();
  const { getForumCategoryById } = useForumCategories();
  const category = getForumCategoryById(forumPostInfo.forumPost?.categoryId);
  return (
    <Box display='flex'>
      <BreadCrumb>
        <Link href='/forum'>
          <BreadcrumbPageTitle>
            <StyledPageIcon pageType='forum' />
            {sectionName}
          </BreadcrumbPageTitle>
        </Link>
      </BreadCrumb>
      {category && (
        <BreadCrumb>
          <Link href={`/forum/${category.path}`}>{category.name}</Link>
        </BreadCrumb>
      )}
      <BreadcrumbPageTitle>{title ?? 'Untitled'}</BreadcrumbPageTitle>
    </Box>
  );
}

function RewardsPageTitle({ sectionName }: { sectionName: string }) {
  const [pageTitle] = usePageTitle();

  return (
    <Box display='flex'>
      <BreadCrumb>
        <Link href='/rewards'>
          <BreadcrumbPageTitle>
            <StyledPageIcon pageType='rewards' />
            {sectionName}
          </BreadcrumbPageTitle>
        </Link>
      </BreadCrumb>
      <BreadcrumbPageTitle>{pageTitle || 'Untitled'}</BreadcrumbPageTitle>
    </Box>
  );
}

function RewardApplicationPageTitle({
  sectionName,
  applicationId,
  rewardId
}: {
  rewardId?: string;
  sectionName: string;
  applicationId?: string;
}) {
  const { data: application } = useGetApplication({ applicationId });
  const { data: rewardWithPageMeta } = useGetReward({ rewardId: rewardId ?? application?.bountyId });

  return (
    <Box display='flex'>
      <BreadCrumb>
        <Link href='/rewards'>{sectionName}</Link>
      </BreadCrumb>
      {rewardWithPageMeta && (
        <>
          <BreadCrumb>
            <Link href={`/${rewardWithPageMeta.page.path}`}>
              <BreadcrumbPageTitle>{rewardWithPageMeta.page.title}</BreadcrumbPageTitle>
            </Link>
          </BreadCrumb>
          <BreadcrumbPageTitle>{applicationId ? 'Application' : 'New Application'}</BreadcrumbPageTitle>
        </>
      )}
    </Box>
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
  pageType
}: {
  pageId?: string;
  pageMeta?: Pick<PageMeta, 'title' | 'icon' | 'parentId' | 'isLocked'>; // pass in page meta in case the page is in the trash, in which case it won't be in the pages map
  pageType?: PageType;
}) {
  const router = useRouter();
  const { mappedFeatures } = useSpaceFeatures();
  if (router.route === '/share/[...pageId]' && router.query?.pageId?.[1] === 'bounties') {
    return <PublicBountyPageTitle />;
  } else if (pageType === 'bounty' || pageType === 'bounty_template' || router.route === '/[domain]/rewards/new') {
    const sectionName = mappedFeatures.rewards.title;
    return <RewardsPageTitle sectionName={sectionName} />;
  } else if (router.route === '/[domain]/rewards/applications/[applicationId]') {
    const applicationId = router.query.applicationId as string;

    const sectionName = mappedFeatures.rewards.title;
    return (
      <RewardApplicationPageTitle
        sectionName={sectionName}
        applicationId={applicationId === 'new' ? undefined : applicationId}
        rewardId={router.query.rewardId as string}
      />
    );
  } else if (pageType === 'proposal' || pageType === 'proposal_template') {
    const sectionName = mappedFeatures.proposals.title;
    return <ProposalPageTitle sectionName={sectionName} />;
  } else if (pageType === 'proposal_notes') {
    const sectionName = mappedFeatures.proposals.title;
    return <ReviewerNotesPageTitle parentId={pageMeta?.parentId} sectionName={sectionName} />;
  } else if (router.route === '/[domain]/[pageId]') {
    return <DocumentPageTitle pageId={pageId} pageMeta={pageMeta} />;
  } else if (router.route.includes('/[domain]/forum')) {
    const sectionName = mappedFeatures.forum.title;
    return <ForumPostTitle pathName={router.pathname} sectionName={sectionName} />;
  } else {
    return <DefaultPageTitle />;
  }
}
