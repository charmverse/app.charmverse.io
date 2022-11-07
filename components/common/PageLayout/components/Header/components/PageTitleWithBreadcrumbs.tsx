import styled from '@emotion/styled';
import { Box, Typography, CircularProgress } from '@mui/material';
import type { PageType } from '@prisma/client';
import { useRouter } from 'next/router';
import type { ReactNode } from 'react';

import Link from 'components/common/Link';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { usePages } from 'hooks/usePages';
import { usePageTitle } from 'hooks/usePageTitle';
import { usePrimaryCharmEditor } from 'hooks/usePrimaryCharmEditor';

import { StyledPageIcon } from '../../PageIcon';

const NEXUS_ROUTES = ['/nexus', '/profile', '/integrations'];

const BreadCrumb = styled.span`
  display: none;

  ${({ theme }) => theme.breakpoints.up('md')} {
    display: inline-flex;
  }

  :after {
    content: ' / ';
    opacity: .5;
    margin-left: .5em;
    margin-right: .5em;
  }
  a {
    color: inherit;
  }
`;

const PageIcon = styled(StyledPageIcon)`
  cursor: inherit;
  display: inline;
  // this is to vertically center images
  img {
    position: relative;
    top: 3px;
  }
`;

const StyledPageTitle = styled(Typography)`
  font-size: .9rem;
  text-overflow: ellipsis;
  max-width: 500px;
` as typeof Typography;

function PageTitle ({ children, sx = {} }: { children: ReactNode, sx?: object }) {
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

function DocumentPageTitle ({ basePath, pageId }: { basePath: string, pageId?: string }) {
  const { pages } = usePages();
  const { isSaving } = usePrimaryCharmEditor();

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
      {displayedCrumbs.map(crumb => (
        <BreadCrumb key={crumb.path}>
          {crumb.path ? (
            <Link href={`${basePath}/${crumb.path}`}>
              <PageTitle sx={{ maxWidth: 160 }}>
                {crumb.icon && <PageIcon icon={crumb.icon} />}
                {crumb.title || 'Untitled'}
              </PageTitle>
            </Link>
          ) : (
            <PageTitle>
              {crumb.title}
            </PageTitle>
          )}
        </BreadCrumb>
      ))}
      {currentPage && (
        <PageTitle sx={{ maxWidth: 240 }}>
          {currentPage.icon && <PageIcon icon={currentPage.icon} />}
          {currentPage.title || 'Untitled'}
        </PageTitle>
      )}
      {isSaving && (
        <Box display='inline-flex' alignItems='center' gap={1} ml={2}>
          <CircularProgress size={12} />
          <Typography variant='subtitle2'>
            Saving
          </Typography>
        </Box>
      )}
    </Box>
  );
}

function ProposalPageTitle ({ basePath }: { basePath: string }) {
  const [pageTitle] = usePageTitle();
  return (
    <PageTitle>
      <BreadCrumb>
        <Link href={`${basePath}/proposals`}>
          Proposals
        </Link>
      </BreadCrumb>
      {pageTitle || 'Untitled'}
    </PageTitle>
  );
}

function BountyPageTitle ({ basePath }: { basePath: string }) {
  const [pageTitle] = usePageTitle();
  return (
    <PageTitle>
      <BreadCrumb>
        <Link href={`${basePath}/bounties`}>
          Bounties
        </Link>
      </BreadCrumb>
      {pageTitle || 'Untitled'}
    </PageTitle>
  );
}

function PublicBountyPageTitle () {
  const space = useCurrentSpace();
  return (
    <PageTitle>
      {space && (
        <>
          <BreadCrumb>
            {`${space.name}`}
          </BreadCrumb>
          Bounties
        </>
      )}

    </PageTitle>
  );
}

function NexusPageTitle ({ route }: { route: string }) {
  const [pageTitle] = usePageTitle();

  // show /nexus as the parent page
  const showNexusParent = route !== '/nexus';

  return (
    <PageTitle>
      {showNexusParent && (
        <BreadCrumb>
          <Link href='/nexus'>
            My Nexus
          </Link>
        </BreadCrumb>
      )}
      {pageTitle}
    </PageTitle>
  );
}

function DefaultPageTitle () {
  const [pageTitle] = usePageTitle();
  return (
    <PageTitle>
      {pageTitle}
    </PageTitle>
  );
}

function EmptyPageTitle () {
  return <div></div>;
}

export default function PageTitleWithBreadcrumbs ({ pageId, pageType }: { pageId?: string, pageType?: PageType }) {
  const router = useRouter();
  const space = useCurrentSpace();

  if (router.route === '/share/[...pageId]' && router.query?.pageId?.[1] === 'bounties') {
    return <PublicBountyPageTitle />;
  }
  else if (pageType === 'bounty') {
    return <BountyPageTitle basePath={`/${router.query.domain}`} />;
  }
  else if (pageType === 'proposal') {
    return <ProposalPageTitle basePath={`/${router.query.domain}`} />;
  }
  else if (router.route === '/[domain]/[pageId]') {
    return <DocumentPageTitle basePath={`/${space?.domain}`} pageId={pageId} />;
  }
  else if (router.route === '/share/[...pageId]') {
    return <DocumentPageTitle basePath={`/share/${space?.domain}`} pageId={pageId} />;
  }
  else if (NEXUS_ROUTES.includes(router.route)) {
    return <NexusPageTitle route={router.route} />;
  }
  else if (router.route.startsWith('/u/')) {
    return <EmptyPageTitle />;
  }
  else {
    return <DefaultPageTitle />;
  }
}
