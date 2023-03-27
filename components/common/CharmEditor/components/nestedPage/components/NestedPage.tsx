import type { NodeViewProps } from '@bangle.dev/core';
import styled from '@emotion/styled';
import { Typography } from '@mui/material';

import Link from 'components/common/Link';
import { PageIcon } from 'components/common/PageLayout/components/PageIcon';
import { STATIC_PAGES } from 'components/common/PageLayout/components/Sidebar/utils/staticPages';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useForumCategories } from 'hooks/useForumCategories';
import { usePages } from 'hooks/usePages';

const NestedPageContainer = styled(Link)`
  align-items: center;
  cursor: pointer;
  display: flex;
  padding: 3px 3px 3px 2px;
  position: relative;
  transition: background 20ms ease-in 0s;

  // disable hover UX on ios which converts first click to a hover event
  @media (pointer: fine) {
    .actions-menu {
      opacity: 0;
    }

    &:hover {
      background-color: ${({ theme }) => theme.palette.background.light};

      .actions-menu {
        opacity: 1;
      }
    }
  }
`;

const StyledTypography = styled(Typography)`
  font-weight: 600;
  border-bottom: 0.05em solid var(--link-underline);
`;

export default function NestedPage({ node, currentPageId }: NodeViewProps & { currentPageId?: string }) {
  const space = useCurrentSpace();
  const { pages } = usePages();
  const { categories } = useForumCategories();
  const nestedPage = pages[node.attrs.id];
  const nestedStaticPage = STATIC_PAGES.find((c) => c.path === node.attrs.path && node.attrs.type === c.path);
  const nestedCategories = categories.find((c) => c.id === node.attrs.id && node.attrs.type === 'forum_category');

  const parentPage = nestedPage?.parentId ? pages[nestedPage.parentId] : null;

  const pageTitle = (nestedPage || nestedStaticPage)?.title || `Forum > ${nestedCategories?.name}`;

  const pageId = nestedPage?.id || nestedStaticPage?.path || nestedCategories?.id;

  const pagePath = nestedPage ? `${space?.domain}/${nestedPage.path}` : '';
  const staticPath = nestedStaticPage ? `${space?.domain}/${nestedStaticPage.path}` : '';
  const categoriesPath = nestedCategories ? `${space?.domain}/forum/${nestedCategories.path}` : '';
  const appPath = pagePath || staticPath || categoriesPath;

  const fullPath = `${window.location.origin}/${appPath}`;

  const isLinkedPage = currentPageId ? parentPage?.id !== currentPageId : false;

  return (
    <NestedPageContainer
      data-test={`nested-page-${pageId}`}
      href={`/${appPath}`}
      color='inherit'
      data-id={`page-${pageId}`}
      data-title={pageTitle}
      data-path={fullPath}
      data-type={node.attrs.type}
    >
      <div>
        {nestedPage && (
          <PageIcon
            isLinkedPage={isLinkedPage}
            isEditorEmpty={!nestedPage.hasContent}
            icon={nestedPage.icon}
            pageType={nestedPage.type}
          />
        )}
        {nestedStaticPage && <PageIcon icon={null} pageType={nestedStaticPage.path} />}
        {nestedCategories && <PageIcon icon={null} pageType='forum_category' />}
      </div>
      <StyledTypography>{(pageTitle ? pageTitle || 'Untitled' : null) || 'Page not found'}</StyledTypography>
    </NestedPageContainer>
  );
}
