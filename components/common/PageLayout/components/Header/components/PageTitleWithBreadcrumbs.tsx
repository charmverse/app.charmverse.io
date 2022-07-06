import styled from '@emotion/styled';
import { Box, Typography, CircularProgress } from '@mui/material';
import Link from 'components/common/Link';
import { usePageTitle } from 'hooks/usePageTitle';
import { usePages } from 'hooks/usePages';
import { useRouter } from 'next/router';
import { ReactNode } from 'react';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { StyledPageIcon } from '../../PageIcon';

const NEXUS_ROUTES = ['/nexus', '/profile', '/integrations'];

const BreadCrumb = styled.span`
  display: inline-flex;
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

function PageTitleWrapper ({ children, sx = {} }: { children: ReactNode, sx?: object }) {
  return (
    <Typography noWrap component='div' sx={{ fontWeight: 500, maxWidth: 500, textOverflow: 'ellipsis', ...sx }}>
      {children}
    </Typography>
  );
}

interface PageBreadCrumb {
  path: null | string;
  icon: string | null;
  title: string;
}

function DocumentPageTitle ({ basePath }: { basePath: string }) {
  const { currentPageId, pages, isEditing } = usePages();

  const currentPage = pages[currentPageId];

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
              <PageTitleWrapper sx={{ maxWidth: 160 }}>
                {crumb.icon && <PageIcon icon={crumb.icon} />}
                {crumb.title || 'Untitled'}
              </PageTitleWrapper>
            </Link>
          ) : (
            <PageTitleWrapper>
              {crumb.title}
            </PageTitleWrapper>
          )}
        </BreadCrumb>
      ))}
      {currentPage && (
        <PageTitleWrapper sx={{ maxWidth: 240 }}>
          {currentPage.icon && <PageIcon icon={currentPage.icon} />}
          {currentPage.title || 'Untitled'}
        </PageTitleWrapper>
      )}
      {isEditing && (
        <Box sx={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 1,
          ml: 2
        }}
        >
          <CircularProgress size={12} />
          <Typography variant='subtitle2'>
            Saving
          </Typography>
        </Box>
      )}
    </Box>
  );
}

function BountyPageTitle ({ basePath }: { basePath: string }) {
  const [pageTitle] = usePageTitle();
  return (
    <PageTitleWrapper>
      <BreadCrumb>
        <Link href={`${basePath}/bounties`}>
          Bounties
        </Link>
      </BreadCrumb>
      {pageTitle}
    </PageTitleWrapper>
  );
}

function PublicBountyPageTitle ({ basePath }: { basePath: string }) {
  const [space] = useCurrentSpace();
  return (
    <PageTitleWrapper>
      <BreadCrumb>
        {
        space && (
          <Link href={`${basePath}`}>
            {space.name}
          </Link>
        )
      }

      </BreadCrumb>
      Bounties
    </PageTitleWrapper>
  );
}

function NexusPageTitle ({ route }: { route: string }) {
  const [pageTitle] = usePageTitle();

  // show /nexus as the parent page
  const showNexusParent = route !== '/nexus';

  return (
    <PageTitleWrapper>
      {showNexusParent && (
        <BreadCrumb>
          <Link href='/nexus'>
            My Nexus
          </Link>
        </BreadCrumb>
      )}
      {pageTitle}
    </PageTitleWrapper>
  );
}

function DefaultPageTitle () {
  const [pageTitle] = usePageTitle();
  return (
    <PageTitleWrapper>
      {pageTitle}
    </PageTitleWrapper>
  );
}

function EmptyPageTitle () {
  return <div></div>;
}

export default function PageTitleWithBreadcrumbs () {
  const router = useRouter();

  if (router.route === '/share/[...pageId]' && router.query?.pageId?.[1] === 'bounties') {
    return <PublicBountyPageTitle basePath={`${router.asPath}`} />;
  }
  else if (router.route === '/[domain]/bounties/[bountyId]') {
    return <BountyPageTitle basePath={`/${router.query.domain}`} />;
  }
  else if (router.route === '/[domain]/[pageId]') {
    return <DocumentPageTitle basePath={`/${router.query.domain}`} />;
  }
  else if (router.route === '/share/[...pageId]') {
    return <DocumentPageTitle basePath={`/share/${(router.query.pageId as string[])[0]}`} />;
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
