import type { PageType } from '@charmverse/core/prisma';
import styled from '@emotion/styled';
import { Box, Typography, CircularProgress } from '@mui/material';
import { useRouter } from 'next/router';
import type { ReactNode } from 'react';

import Link from 'components/common/Link';
import { useCharmEditor } from 'hooks/useCharmEditor';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { usePages } from 'hooks/usePages';
import { usePageTitle } from 'hooks/usePageTitle';

import { PageIcon } from '../../PageIcon';

const BreadCrumb = styled.span`
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

function PageTitle({ children, sx = {} }: { children: ReactNode; sx?: object }) {
  return (
    <StyledPageTitle noWrap component='div' sx={sx}>
      {children}
    </StyledPageTitle>
  );
}

interface PageBreadCrumb {
  path: null | string;
  icon: string | null;
  title: string;
}

function DocumentPageTitle({ basePath, pageId }: { basePath: string; pageId?: string }) {
  const { pages } = usePages();
  const { isSaving } = useCharmEditor();

  const currentPage = pageId ? pages[pageId] : undefined;

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
              <PageTitle sx={{ maxWidth: 160 }}>
                {crumb.icon && <StyledPageIcon icon={crumb.icon} />}
                {crumb.title || 'Untitled'}
              </PageTitle>
            </Link>
          ) : (
            <PageTitle>{crumb.title}</PageTitle>
          )}
        </BreadCrumb>
      ))}
      {currentPage && (
        <PageTitle sx={{ maxWidth: 240 }}>
          {currentPage.icon && <StyledPageIcon icon={currentPage.icon} />}
          {currentPage.title || 'Untitled'}
        </PageTitle>
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

function ProposalPageTitle({ basePath }: { basePath: string }) {
  const [pageTitle] = usePageTitle();
  return (
    <PageTitle>
      <BreadCrumb>
        <Link href={`${basePath}/proposals`}>Proposals</Link>
      </BreadCrumb>
      {pageTitle || 'Untitled'}
    </PageTitle>
  );
}

function ForumPostTitle({ basePath, pathName }: { basePath: string; pathName: string }) {
  const [pageTitle] = usePageTitle();
  const title = pathName === '/[domain]/forum' ? 'All Categories' : pageTitle;

  return (
    <PageTitle>
      <BreadCrumb>
        <Link href={`${basePath}/forum`}>Forum</Link>
      </BreadCrumb>
      {title ?? 'Untitled'}
    </PageTitle>
  );
}

function BountyPageTitle({ basePath }: { basePath: string }) {
  const [pageTitle] = usePageTitle();
  return (
    <PageTitle>
      <BreadCrumb>
        <Link href={`${basePath}/bounties`}>Bounties</Link>
      </BreadCrumb>
      {pageTitle || 'Untitled'}
    </PageTitle>
  );
}

function PublicBountyPageTitle() {
  const space = useCurrentSpace();
  return (
    <PageTitle>
      {space && (
        <>
          <BreadCrumb>{`${space.name}`}</BreadCrumb>
          Bounties
        </>
      )}
    </PageTitle>
  );
}

function DefaultPageTitle() {
  const [pageTitle] = usePageTitle();
  return <PageTitle>{pageTitle}</PageTitle>;
}

function EmptyPageTitle() {
  return <div></div>;
}

export default function PageTitleWithBreadcrumbs({ pageId, pageType }: { pageId?: string; pageType?: PageType }) {
  const router = useRouter();

  if (router.route === '/share/[...pageId]' && router.query?.pageId?.[1] === 'bounties') {
    return <PublicBountyPageTitle />;
  } else if (pageType === 'bounty') {
    return <BountyPageTitle basePath={`/${router.query.domain}`} />;
  } else if (pageType === 'proposal') {
    return <ProposalPageTitle basePath={`/${router.query.domain}`} />;
  } else if (router.route === '/[domain]/[pageId]') {
    return <DocumentPageTitle basePath={`/${router.query.domain}`} pageId={pageId} />;
  } else if (router.route.includes('/[domain]/forum')) {
    return <ForumPostTitle basePath={`/${router.query.domain}`} pathName={router.pathname} />;
  } else if (router.route === '/share/[...pageId]') {
    return <DocumentPageTitle basePath={`/share/${router.query.domain}`} pageId={pageId} />;
  } else if (router.route.startsWith('/u/')) {
    return <EmptyPageTitle />;
  } else {
    return <DefaultPageTitle />;
  }
}
