import type { PageNodeWithChildren } from '@charmverse/core/pages';
import { pageTree } from '@charmverse/core/pages/utilities';
import type { Page } from '@charmverse/core/prisma';
import { isTruthy } from '@packages/utils/types';
import type { SyntheticEvent } from 'react';
import { memo, useCallback, useEffect, useMemo } from 'react';

import charmClient from 'charmClient';
import { useCharmRouter } from 'hooks/useCharmRouter';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useFavoritePages } from 'hooks/useFavoritePages';
import { useLocalStorage } from 'hooks/useLocalStorage';
import { usePageFromPath } from 'hooks/usePageFromPath';
import { usePages } from 'hooks/usePages';
import { useSnackbar } from 'hooks/useSnackbar';
import { useUser } from 'hooks/useUser';
import { emitSocketMessage } from 'hooks/useWebSocketClient';
import type { NewPageInput } from 'lib/pages/addPage';
import { addPageAndRedirect } from 'lib/pages/addPage';
import { filterVisiblePages } from 'lib/pages/filterVisiblePages';
import type { PageMeta } from 'lib/pages/interfaces';

import { NavIconHoverCollapse, NavIconHoverExpand } from './components/NavIconHover';
import type { MenuNode, ParentMenuNode } from './components/TreeNode';
import TreeNode from './components/TreeNode';
import { TreeRoot } from './components/TreeRoot';

function mapPageToMenuNode(page: PageMeta): MenuNode {
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
type PageNavigationProps = {
  deletePage?: (id: string) => void;
  isFavorites?: boolean;
  rootPageIds?: string[];
  onClick?: () => void;
};

function PageNavigation({ deletePage, isFavorites, rootPageIds, onClick }: PageNavigationProps) {
  const { navigateToSpacePath, router } = useCharmRouter();
  const { pages, setPages, mutatePage } = usePages();

  const currentPage = usePageFromPath();
  const { space } = useCurrentSpace();
  const { user } = useUser();
  const [expanded, setExpanded] = useLocalStorage<string[]>(`${space?.id}.expanded-pages`, []);
  const { showMessage } = useSnackbar();
  const { reorderFavorites } = useFavoritePages();

  const pagesArray: MenuNode[] = isFavorites
    ? Object.values(pages)
        .filter((page): page is PageMeta => isTruthy(page) && !page.hideFromSidebar)
        .map(mapPageToMenuNode)
    : filterVisiblePages(pages)
        .filter((page): page is PageMeta => isTruthy(page) && !page.hideFromSidebar)
        .map(mapPageToMenuNode);

  const currentPageId = currentPage?.id ?? '';

  const pageHash = JSON.stringify(pagesArray);

  const mappedItems = useMemo(() => {
    const mappedPages = pageTree.mapPageTree<MenuNode>({ items: pagesArray, rootPageIds });
    const pageIds: string[] = []; // keep track of page ids to avoid duplicates
    mappedPages.forEach((page, index) => {
      pageIds.push(page.id);
    });
    mappedPages.forEach((page, index) => {
      page.children = page.children.filter((child) => {
        if (pageIds.includes(child.id)) {
          return false;
        }
        pageIds.push(child.id);
        child.children = child.children.filter((_child) => {
          if (pageIds.includes(_child.id)) {
            return false;
          }
          pageIds.push(_child.id);
          return true;
        });
        return true;
      });
    });
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
      return (
        droppedItem.id !== targetItem?.id &&
        !pageTree.isParentNode({ node: droppedItem, child: targetItem, items: pages })
      );
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
        const siblings = pageTree.sortNodes(unsortedSiblings);
        const droppedPage = _pages[droppedItem.id];
        if (!droppedPage) {
          throw new Error('cannot find dropped page');
        }

        const originIndex: number = siblings.findIndex((sibling) => sibling.id === containerItem.id);
        siblings.splice(originIndex, 0, droppedPage);
        siblings.forEach((page, _index) => {
          page.index = _index;
          page.parentId = parentId ?? null;
          charmClient.pages.updatePage({
            id: page.id,
            index: _index,
            // If there is no parentId, the page was dropped at the root level
            parentId: parentId ?? null
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

        // dropped on root level, so remove child page reference in parent's content
        if (droppedItem.parentId !== containerItem.parentId) {
          emitSocketMessage({
            type: 'page_reordered_sidebar_to_sidebar',
            payload: {
              pageId: droppedItem.id,
              newParentId: containerItem.parentId
            }
          });
        }

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

      if (parentId) {
        emitSocketMessage({
          type: 'page_reordered_sidebar_to_sidebar',
          payload: {
            pageId: droppedItem.id,
            newParentId: containerItem.id
          }
        });
      }

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
        return addPageAndRedirect(newPage, (path) => {
          navigateToSpacePath(path);
        });
      }
    },
    [space?.id, user?.id]
  );

  return (
    <TreeRoot
      expandedItems={expanded ?? []}
      // @ts-ignore - we use null instead of undefined to control the element
      selected={selectedNodeId}
      onExpandedItemsChange={onNodeToggle}
      aria-label='items navigator'
      slots={{ expandIcon: NavIconHoverCollapse, collapseIcon: NavIconHoverExpand }}
      isFavorites={isFavorites}
    >
      {mappedItems.map((item) => (
        <TreeNode
          key={item.id}
          item={item}
          onDropChild={isFavorites ? null : onDropChild}
          onDropAdjacent={onDropAdjacent}
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
