import type { PageMeta } from '@charmverse/core/pages';
import styled from '@emotion/styled';
import { Typography } from '@mui/material';
import type { EditorView } from 'prosemirror-view';

import type { NodeViewProps } from 'components/common/CharmEditor/components/@bangle.dev/core/node-view';
import { useEditorViewContext } from 'components/common/CharmEditor/components/@bangle.dev/react/hooks';
import Link from 'components/common/Link';
import { NoAccessPageIcon, PageIcon } from 'components/common/PageLayout/components/PageIcon';
import type { StaticPage } from 'components/common/PageLayout/components/Sidebar/utils/staticPages';
import { STATIC_PAGES } from 'components/common/PageLayout/components/Sidebar/utils/staticPages';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useForumCategories } from 'hooks/useForumCategories';
import { usePages } from 'hooks/usePages';

import { enableDragAndDrop } from '../../../utils';
import { pageNodeDropPluginKey } from '../../prosemirror/prosemirror-dropcursor/dropcursor';

const NestedPageContainer = styled(Link)`
  align-items: center;
  cursor: pointer;
  display: flex;
  padding: 3px 3px 3px 2px;
  position: relative;
  transition: background 20ms ease-in 0s;
  margin: ${({ theme }) => `${theme.spacing(0.5)} 0px`};

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

function resetPageNodeDropPluginState(view: EditorView) {
  const pluginState = pageNodeDropPluginKey.getState(view.state) as {
    hoveredPageDomNode: HTMLElement | null;
  };
  if (pluginState.hoveredPageDomNode) {
    view.dispatch(view.state.tr.setMeta(pageNodeDropPluginKey, { hoveredPageDomNode: null }));
    pluginState.hoveredPageDomNode.removeAttribute('id');
  }
}

export default function NestedPage({
  isLinkedPage,
  node,
  currentPageId,
  getPos
}: NodeViewProps & { isLinkedPage?: boolean; currentPageId?: string }) {
  const { space } = useCurrentSpace();
  const view = useEditorViewContext();
  const { pages, loadingPages } = usePages();
  const { categories } = useForumCategories();
  const documentPage = pages[node.attrs.id];
  const staticPage = STATIC_PAGES.find((c) => c.path === node.attrs.path && node.attrs.type === c.path);
  const forumCategoryPage = categories.find((c) => c.id === node.attrs.id && node.attrs.type === 'forum_category');
  const parentPage = documentPage?.parentId ? pages[documentPage.parentId] : null;
  let pageTitle = '';
  if (documentPage || staticPage) {
    pageTitle = (documentPage || staticPage)?.title || 'Untitled';
  } else if (forumCategoryPage) {
    pageTitle = `Forum > ${forumCategoryPage?.name || 'Untitled'}`;
  } else if (!loadingPages) {
    pageTitle = 'No access';
  }
  const pageId = documentPage?.id || staticPage?.path || forumCategoryPage?.id;

  const pagePath = documentPage ? `${space?.domain}/${documentPage.path}` : '';
  const staticPath = staticPage ? `${space?.domain}/${staticPage.path}` : '';
  const categoryPath = forumCategoryPage ? `${space?.domain}/forum/${forumCategoryPage.path}` : '';
  const appPath = pagePath || staticPath || categoryPath;

  const fullPath = `${window.location.origin}/${appPath}`;

  const _isLinkedPage = isLinkedPage ?? (currentPageId ? parentPage?.id !== currentPageId : false);

  return (
    <NestedPageContainer
      data-test={`${isLinkedPage ? 'linked-page' : 'nested-page'}-${pageId}`}
      data-page-type={node.attrs.type ?? documentPage?.type}
      href={appPath ? `/${appPath}` : undefined}
      color='inherit'
      data-id={pageId}
      data-title={pageTitle}
      data-path={fullPath}
      onDragStart={() => {
        const pos = getPos();
        if (typeof pos === 'number') {
          enableDragAndDrop(view, pos);
        }
      }}
      data-type={node.attrs.type}
      // Only works for firefox
      onDragExitCapture={() => {
        resetPageNodeDropPluginState(view);
      }}
      // Should only works for chrome, opera and IE, firefox also handles it but for ff we have onDragExitCapture
      onDragLeaveCapture={() => {
        const isFirefox = navigator.userAgent.toLowerCase().indexOf('firefox') > -1;
        if (!isFirefox) {
          resetPageNodeDropPluginState(view);
        }
      }}
    >
      <div>
        <LinkIcon
          isLinkedPage={_isLinkedPage}
          documentPage={documentPage}
          staticPage={staticPage}
          isCategoryPage={!!forumCategoryPage}
        />
      </div>
      <StyledTypography>{pageTitle}</StyledTypography>
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
