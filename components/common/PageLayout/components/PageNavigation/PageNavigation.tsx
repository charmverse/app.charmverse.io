import ExpandMoreIcon from '@mui/icons-material/ArrowDropDown'; // ExpandMore
import ChevronRightIcon from '@mui/icons-material/ArrowRight'; // ChevronRight
import type { Page } from '@prisma/client';
import { useRouter } from 'next/router';
import type { SyntheticEvent } from 'react';
import { memo, useCallback, useEffect, useMemo } from 'react';

import charmClient from 'charmClient';
import { NavIconHover } from 'components/common/PageLayout/components/PageNavigation/components/NavIconHover';
import { TreeRoot } from 'components/common/PageLayout/components/PageNavigation/components/TreeRoot';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useFavoritePages } from 'hooks/useFavoritePages';
import { useLocalStorage } from 'hooks/useLocalStorage';
import { usePageFromPath } from 'hooks/usePageFromPath';
import { usePages } from 'hooks/usePages';
import { useSnackbar } from 'hooks/useSnackbar';
import { useUser } from 'hooks/useUser';
import type { IPageWithPermissions, NewPageInput, PageMeta, PageNodeWithChildren, PagesMap } from 'lib/pages';
import { addPageAndRedirect } from 'lib/pages';
import { findParentOfType } from 'lib/pages/findParentOfType';
import { isParentNode, mapPageTree, sortNodes } from 'lib/pages/mapPageTree';
import { isTruthy } from 'lib/utilities/types';

import type { MenuNode, ParentMenuNode } from './components/TreeNode';
import TreeNode from './components/TreeNode';

function mapPageToMenuNode(page: IPageWithPermissions): MenuNode {
  return {
    id: page.id,
    title: page.title,
    icon: page.icon,
    index: page.index,
    isEmptyContent: !page.hasContent,
    parentId: page.parentId,
    path: page.path,
    type: page.type,
    createdAt: page.createdAt,
    deletedAt: page.deletedAt,
    spaceId: page.spaceId
  };
}

export function filterVisiblePages(pageMap: PagesMap<PageMeta>, rootPageIds: string[] = []): MenuNode[] {
  return Object.values(pageMap)
    .filter((page): page is IPageWithPermissions =>
      isTruthy(
        page &&
          (page.type === 'board' ||
            page.type === 'page' ||
            page.type === 'linked_board' ||
            rootPageIds?.includes(page.id)) &&
          !findParentOfType({
            pageId: page.id,
            pageType: 'card',
            pageMap
          })
      )
    )
    .map(mapPageToMenuNode);
}

type PageNavigationProps = {
  deletePage?: (id: string) => void;
  isFavorites?: boolean;
  rootPageIds?: string[];
  onClick?: () => void;
};

function PageNavigation({ deletePage, isFavorites, rootPageIds, onClick }: PageNavigationProps) {
  const router = useRouter();
  const { pages, setPages, mutatePage } = usePages();

  const currentPage = usePageFromPath();
  const space = useCurrentSpace();
  const { user } = useUser();
  const [expanded, setExpanded] = useLocalStorage<string[]>(`${space?.id}.expanded-pages`, []);
  const { showMessage } = useSnackbar();
  const { reorderFavorites } = useFavoritePages();

  const pagesArray: MenuNode[] = isFavorites
    ? Object.values(pages)
        .filter((page): page is IPageWithPermissions => isTruthy(page))
        .map(mapPageToMenuNode)
    : filterVisiblePages(pages);

  const currentPageId = currentPage?.id ?? '';

  const pageHash = JSON.stringify(pagesArray);

  const mappedItems = useMemo(() => {
    const mappedPages = mapPageTree<MenuNode>({ items: pagesArray, rootPageIds });
    if (isFavorites) {
      return rootPageIds
        ?.map((id) => mappedPages.find((page) => page.id === id))
        .filter(Boolean) as PageNodeWithChildren<MenuNode>[];
    }

    return mappedPages;
  }, [pageHash, rootPageIds]);

  const isValidDropTarget = useCallback(
    ({ droppedItem, targetItem }: { droppedItem: MenuNode; targetItem: MenuNode }) => {
      // do not allow to drop parent onto children
      return droppedItem.id !== targetItem?.id && !isParentNode({ node: droppedItem, child: targetItem, items: pages });
    },
    [pagesArray]
  );

  const onDropAdjacent = useCallback(
    (droppedItem: ParentMenuNode, containerItem: MenuNode) => {
      if (droppedItem.id === containerItem?.id || !isValidDropTarget({ droppedItem, targetItem: containerItem })) {
        return;
      }

      if (isFavorites) {
        reorderFavorites({ reorderId: droppedItem.id, nextSiblingId: containerItem.id });
        return;
      }
      const parentId = containerItem.parentId;

      setPages((_pages) => {
        const unsortedSiblings = Object.values(_pages)
          .filter(isTruthy)
          .filter((page) => page && page.parentId === parentId && page.id !== droppedItem.id);
        const siblings = sortNodes(unsortedSiblings);

        const droppedPage = _pages[droppedItem.id];
        if (!droppedPage) {
          throw new Error('cannot find dropped page');
        }

        const originIndex: number = siblings.findIndex((sibling) => sibling.id === containerItem.id);
        siblings.splice(originIndex, 0, droppedPage);
        siblings.forEach((page, _index) => {
          page.index = _index;
          page.parentId = parentId;
          charmClient.pages.updatePage({
            id: page.id,
            index: _index,
            parentId
          });
        });
        siblings.forEach((page) => {
          const _currentPage = _pages[page.id];
          if (_currentPage) {
            _pages[page.id] = {
              ..._currentPage,
              index: page.index,
              parentId: page.parentId
            };
          }
        });

        return { ..._pages };
      });
    },
    [isValidDropTarget, rootPageIds]
  );

  const onDropChild = useCallback(
    (droppedItem: MenuNode, containerItem: MenuNode) => {
      if (containerItem.type.match(/board/)) {
        return;
      }

      // Prevent a page becoming child of itself
      if (!isValidDropTarget({ droppedItem, targetItem: containerItem })) {
        return;
      }

      // Make sure the new parent is not in the children of this page
      let currentNode: MenuNode | undefined = containerItem;
      while (currentNode) {
        if (currentNode.parentId === droppedItem.id) {
          return;
        }
        // We reached the current node. It's fine to reorder under a parent or root
        else if (currentNode.id === droppedItem.id || !currentNode.parentId) {
          break;
        } else {
          currentNode = pages[currentNode.parentId];
        }
      }

      const index = 1000; // send it to the end
      const parentId = (containerItem as MenuNode)?.id ?? null;

      mutatePage({ id: droppedItem.id, parentId });

      charmClient.pages
        .updatePage({
          id: droppedItem.id,
          index, // send it to the end
          parentId
        })
        .catch((err) => {
          showMessage(err.message, 'error');
        });
    },
    [pages, isValidDropTarget]
  );

  useEffect(() => {
    // expand the parent of the active page
    if (currentPage?.parentId && !isFavorites) {
      if (!expanded?.includes(currentPage.parentId) && currentPage.type !== 'card') {
        setExpanded(expanded?.concat(currentPage.parentId) ?? []);
      }
    }
  }, [currentPage, pages, isFavorites]);

  function onNodeToggle(event: SyntheticEvent, nodeIds: string[]) {
    setExpanded(nodeIds);
  }

  let selectedNodeId: string | null = currentPageId ?? null;

  if (typeof router.query.viewId === 'string') {
    selectedNodeId = router.query.viewId;
  }

  const addPage = useCallback(
    (page: Partial<Page>) => {
      if (space && user) {
        const newPage: NewPageInput = {
          ...page,
          createdBy: user.id,
          spaceId: space.id
        };
        return addPageAndRedirect(newPage, router);
      }
    },
    [space?.id, user?.id]
  );

  return (
    <TreeRoot
      expanded={expanded ?? []}
      // @ts-ignore - we use null instead of undefined to control the element
      selected={selectedNodeId}
      onNodeToggle={onNodeToggle}
      aria-label='items navigator'
      defaultCollapseIcon={
        <NavIconHover
          width={{ xs: 30, md: 20 }}
          height={{ xs: 30, md: 20 }}
          display='flex'
          alignItems='center'
          justifyContent='center'
        >
          <ExpandMoreIcon fontSize='large' />
        </NavIconHover>
      }
      defaultExpandIcon={
        <NavIconHover
          width={{ xs: 30, md: 20 }}
          height={{ xs: 30, md: 20 }}
          display='flex'
          alignItems='center'
          justifyContent='center'
        >
          <ChevronRightIcon fontSize='large' />
        </NavIconHover>
      }
      isFavorites={isFavorites}
    >
      {mappedItems.map((item) => (
        <TreeNode
          key={item.id}
          item={item}
          onDropChild={isFavorites ? null : onDropChild}
          onDropAdjacent={onDropAdjacent}
          pathPrefix={`/${router.query.domain}`}
          // pass down so parent databases can highlight themselves
          selectedNodeId={selectedNodeId}
          addPage={addPage}
          deletePage={deletePage}
          onClick={onClick}
          validateTarget={isValidDropTarget}
          isFavorites={isFavorites}
        />
      ))}
    </TreeRoot>
  );
}

export default memo(PageNavigation);
