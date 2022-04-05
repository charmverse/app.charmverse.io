import styled from '@emotion/styled';
import { Box, Link, Typography, CircularProgress } from '@mui/material';
import { usePageTitle } from 'hooks/usePageTitle';
import { usePages } from 'hooks/usePages';
import { useRouter } from 'next/router';
import { ReactNode } from 'react';
import { StyledPageIcon } from '../PageNavigation';

const BreadCrumb = styled.span`
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

function PageTitleWrapper ({ children }: { children: ReactNode }) {
  return (
    <Typography noWrap component='div' sx={{ fontWeight: 500, maxWidth: 500, textOverflow: 'ellipsis' }}>
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

  const displayedCrumbs = breadcrumbs.slice(0, 2);
  const trimmedCrumbs = (displayedCrumbs.length < breadcrumbs.length);
  return (
    <>
      {displayedCrumbs.map(crumb => (
        <BreadCrumb key={crumb.path}>
          <Link href={`/${router.query.domain}/${crumb.path}`}>
            <Box display='inline-flex'>
              {crumb.icon && <StyledPageIcon icon={crumb.icon} />}
              {crumb.title || 'Untitled'}
            </Box>
          </Link>
        </BreadCrumb>
      ))}
      {trimmedCrumbs && (
        <BreadCrumb>
          <span className='breadcrumb-slash'>...</span>
        </BreadCrumb>
      )}
      {currentPage && (
        <Box display='inline-flex'>
          {currentPage.icon && <StyledPageIcon icon={currentPage.icon} />}
          {currentPage.title || 'Untitled'}
        </Box>
      )}
      {isEditing && (
        <Box sx={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 1
        }}
        >
          <CircularProgress size={12} />
          <Typography variant='subtitle2'>
            Saving
          </Typography>
        </Box>
      )}
    </>
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
