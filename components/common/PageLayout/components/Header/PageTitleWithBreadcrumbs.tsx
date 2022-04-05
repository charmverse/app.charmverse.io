import styled from '@emotion/styled';
import { Box, Typography, CircularProgress } from '@mui/material';
import Link from 'components/common/Link';
import { usePageTitle } from 'hooks/usePageTitle';
import { usePages } from 'hooks/usePages';
import { useRouter } from 'next/router';
import { ReactNode } from 'react';
import { StyledPageIcon } from '../PageNavigation';

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

/* <Box sx={{
  flex: 1,
  display: 'flex',
  alignItems: 'center',
  gap: 2
}}
> */
function WorkspacePageTitle () {
  const router = useRouter();
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
            <Link href={`/${router.query.domain}/${crumb.path}`}>
              <PageTitleWrapper sx={{ maxWidth: 160 }}>
                {crumb.icon && <StyledPageIcon icon={crumb.icon} style={{ display: 'inline' }} />}
                {crumb.title || 'Untitled'}
              </PageTitleWrapper>
            </Link>
          ) : (
            <PageTitleWrapper sx={{ }}>
              {crumb.title}
            </PageTitleWrapper>
          )}
        </BreadCrumb>
      ))}
      {currentPage && (
        <PageTitleWrapper sx={{ maxWidth: 240 }}>
          {currentPage.icon && <StyledPageIcon icon={currentPage.icon} style={{ display: 'inline' }} />}
          {currentPage.title || 'Untitled'}
        </PageTitleWrapper>
      )}
      {true && (
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

function BountyPageTitle () {
  const router = useRouter();
  const [pageTitle] = usePageTitle();
  return (
    <PageTitleWrapper>
      <BreadCrumb>
        <Link href={`/${router.query.domain}/bounties`}>
          Bounties
        </Link>
      </BreadCrumb>
      {pageTitle}
    </PageTitleWrapper>
  );
}

function StandardPageTitle () {
  const [pageTitle] = usePageTitle();
  return (
    <PageTitleWrapper>
      {pageTitle}
    </PageTitleWrapper>
  );
}

export default function PageTitleWithBreadcrumbs () {
  const router = useRouter();
  if (router.route === '/[domain]/bounties/[bountyId]') {
    return <BountyPageTitle />;
  }
  else if (router.route === '/[domain]/[pageId]') {
    return <WorkspacePageTitle />;
  }
  else {
    return <StandardPageTitle />;
  }
}
