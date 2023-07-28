import type { NodeViewProps } from '@bangle.dev/core';
import { TextSelection } from '@bangle.dev/pm';
import { useEditorViewContext } from '@bangle.dev/react';
import type { PageMeta } from '@charmverse/core/pages';
import styled from '@emotion/styled';
import { Typography } from '@mui/material';

import Link from 'components/common/Link';
import { NoAccessPageIcon, PageIcon } from 'components/common/PageLayout/components/PageIcon';
import type { StaticPage } from 'components/common/PageLayout/components/Sidebar/utils/staticPages';
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

export default function NestedPage({ node, currentPageId, getPos }: NodeViewProps & { currentPageId?: string }) {
  const { space } = useCurrentSpace();
  const view = useEditorViewContext();
  const { pages } = usePages();
  const { categories } = useForumCategories();
  const documentPage = pages[node.attrs.id];
  const staticPage = STATIC_PAGES.find((c) => c.path === node.attrs.path && node.attrs.type === c.path);
  const forumCategoryPage = categories.find((c) => c.id === node.attrs.id && node.attrs.type === 'forum_category');

  const parentPage = documentPage?.parentId ? pages[documentPage.parentId] : null;

  const pageTitle =
    (documentPage || staticPage)?.title || (forumCategoryPage ? `Forum > ${forumCategoryPage?.name}` : '');
  const pageId = documentPage?.id || staticPage?.path || forumCategoryPage?.id;

  const pagePath = documentPage ? `${space?.domain}/${documentPage.path}` : '';
  const staticPath = staticPage ? `${space?.domain}/${staticPage.path}` : '';
  const categoryPath = forumCategoryPage ? `${space?.domain}/forum/${forumCategoryPage.path}` : '';
  const appPath = pagePath || staticPath || categoryPath;

  const fullPath = `${window.location.origin}/${appPath}`;

  const isLinkedPage = currentPageId ? parentPage?.id !== currentPageId : false;

  return (
    <NestedPageContainer
      data-test={`nested-page-${pageId}`}
      href={appPath ? `/${appPath}` : undefined}
      color='inherit'
      data-id={`page-${pageId}`}
      data-title={pageTitle}
      data-path={fullPath}
      onDragStart={() => {
        const nodePos = getPos();
        view.dispatch(
          view.state.tr
            .setMeta('row-handle-is-dragging', true)
            .setSelection(new TextSelection(view.state.doc.resolve(nodePos), view.state.doc.resolve(nodePos + 1)))
        );
      }}
      data-type={node.attrs.type}
    >
      <div>
        <LinkIcon
          isLinkedPage={isLinkedPage}
          documentPage={documentPage}
          staticPage={staticPage}
          isCategoryPage={!!forumCategoryPage}
        />
      </div>
      <StyledTypography>{(pageTitle ? pageTitle || 'Untitled' : null) || 'No access'}</StyledTypography>
    </NestedPageContainer>
  );
}

function LinkIcon({
  isLinkedPage,
  documentPage,
  staticPage,
  isCategoryPage
}: {
  isLinkedPage: boolean;
  documentPage?: PageMeta;
  staticPage?: StaticPage;
  isCategoryPage: boolean;
}) {
  if (staticPage) {
    return <PageIcon pageType={staticPage.path} />;
  } else if (isCategoryPage) {
    return <PageIcon pageType='forum_category' />;
  } else if (documentPage) {
    return (
      <PageIcon
        isLinkedPage={isLinkedPage}
        isEditorEmpty={!documentPage.hasContent}
        icon={documentPage.icon}
        pageType={documentPage.type}
      />
    );
  } else {
    return <NoAccessPageIcon />;
  }
}
