import { PageNotFoundError } from '../errors';
import { sortBy } from '../utilities/array';

import type { PageNode, PageNodeWithChildren, PageTreeMappingInput, TargetPageTree } from './interfaces';

export function sortNodes<T>(nodes: PageNode<T>[]) {
  return [
    ...sortBy(
      nodes.filter((node) => node.index >= 0),
      ['index', 'createdAt']
    ),
    ...sortBy(
      nodes.filter((node) => node.index < 0),
      ['createdAt']
    )
  ];
}

export function reducePagesToPageTree<T extends PageNode = PageNode>({
  items,
  rootPageIds,
  includeDeletedPages
}: Omit<PageTreeMappingInput<T>, 'targetPageId'>): {
  itemMap: { [key: string]: number };
  itemsWithChildren: PageNodeWithChildren<T>[];
  rootNodes: PageNodeWithChildren<T>[];
} {
  function includableNode(node: PageNode): boolean {
    if (!includeDeletedPages && node.deletedAt) {
      return false;
    } else {
      return true;
    }
  }

  // Assign empty children to each node
  const tempItems: PageNodeWithChildren<T>[] = items.map((item: T) => {
    if (item.parentId === item.id) {
      // Prevent accidental infinite recursion
      item.parentId = null;
    }

    return {
      ...item,
      children: []
    };
  });

  // A map that contains the temp items array position for each page
  const map: { [key: string]: number } = {};

  // Track parent IDs to avoid infinite recursion
  const mapWithParentId: { [key: string]: string | null } = {};
  let node: PageNodeWithChildren<T>;

  // Root pages will only be pushed here if rootPageIds is undefined, or if it is provided and the root page ID matches
  const roots = [];

  let i: number;
  for (i = 0; i < tempItems.length; i += 1) {
    const currentItem = tempItems[i];
    map[currentItem.id] = i; // initialize the map
    mapWithParentId[currentItem.id] = currentItem.parentId;

    if (currentItem.parentId && mapWithParentId[currentItem.parentId] === currentItem.id) {
      // Circular reference detected. Delete the second reference
      currentItem.parentId = null;
    }
  }

  for (i = 0; i < tempItems.length; i += 1) {
    node = tempItems[i];
    const parentId = node.parentId;
    const parentIndex = parentId ? map[parentId] : -1;
    const parentNode = typeof parentIndex === 'number' && parentIndex >= 0 ? tempItems[parentIndex] : undefined;

    if (parentNode && includableNode(node)) {
      parentNode.children.push(node);
      parentNode.children = sortNodes(parentNode.children);
    }
    // If it's a root page always show it
    else if (!node.parentId && !rootPageIds && includableNode(node)) {
      roots.push(node);
    }
    // parent may be undefined if user has no access to it
    else if (node.parentId && !parentNode) {
      roots.push(node);
    }

    if (rootPageIds?.includes(node.id)) {
      roots.push(node);
    }
  }

  return {
    itemMap: map,
    rootNodes: sortNodes(roots),
    itemsWithChildren: tempItems
  };
}

/**
 * Used in the user interface to map pages to a navigable tree
 */
export function mapPageTree<T extends PageNode = PageNode>({
  items,
  rootPageIds,
  includeDeletedPages
}: Omit<PageTreeMappingInput<T>, 'targetPageId' | 'includeCards'>): PageNodeWithChildren<T>[] {
  const { rootNodes } = reducePagesToPageTree({
    items,
    rootPageIds,
    includeDeletedPages
  });

  return sortNodes(rootNodes);
}

/**
 * Given a list of pages, resolve only the tree specific to the target page
 * @return parents is the array of parent pages from nearest parent to the root. target page is the target page along with all child pages as a tree
 */
export function mapTargetPageTree<T extends PageNode = PageNode>({
  items,
  targetPageId,
  includeDeletedPages
}: Omit<PageTreeMappingInput<T>, 'rootPageIds'> & { targetPageId: string }): TargetPageTree<T> {
  const { itemMap, itemsWithChildren } = reducePagesToPageTree({
    items,
    includeDeletedPages
  });

  /**
   * Goes from the page to its root, and generates a list of references corresponding to the path
   * @childIdChain A list of page IDs going from the target page to the first child of the root
   */
  function resolveRootId(
    currentNodeId: string,
    childIdChain: string[] = []
  ): { rootId: string; childIdChain: string[] } {
    const currentNode = itemsWithChildren[itemMap[currentNodeId]];

    const parentId = currentNode.parentId;

    // If the parent does not exist, consider current node as the root
    if (!parentId || !itemsWithChildren[itemMap[parentId]]) {
      return {
        rootId: currentNodeId,
        childIdChain
      };
    }

    childIdChain.push(currentNodeId);

    return resolveRootId(parentId, childIdChain);
  }

  const { childIdChain, rootId } = resolveRootId(targetPageId);

  const rootNode = itemsWithChildren[itemMap[rootId]];

  const parents: PageNodeWithChildren<T>[] = [];

  if (rootNode.id !== targetPageId) {
    const childIdChainFromRootChild = childIdChain.reverse();

    let currentNode = rootNode as PageNodeWithChildren<T>;

    for (const childId of childIdChainFromRootChild) {
      parents.push(currentNode);

      const childNode = currentNode.children.find((child) => child.id === childId);

      if (!childNode) {
        throw new PageNotFoundError(childId);
      }

      currentNode = childNode as PageNodeWithChildren<T>;
    }
  }

  const targetPageNode = itemsWithChildren[itemMap[targetPageId]] as PageNodeWithChildren<T>;

  return {
    // Parents were resolved from the root, but we need to return them from the closest to the page
    parents: parents.reverse(),
    targetPage: targetPageNode
  } as TargetPageTree<T>;
}

/**
 * Given a page node, returns a flattened list of its children
 */
export function flattenTree<T extends PageNode = PageNode>(
  node: PageNodeWithChildren<T>,
  flatNodes: PageNodeWithChildren<T>[] = []
): PageNodeWithChildren<T>[] {
  node.children.forEach((childNode) => {
    flatNodes.push(childNode);
    flattenTree(childNode, flatNodes);
  });

  return flatNodes;
}

type BaseNode = { id: string; parentId: string | null };

export function isParentNode({
  node,
  child,
  items
}: {
  node: BaseNode | null;
  child: BaseNode | null;
  items: Record<string, BaseNode | undefined>;
}): boolean {
  if (!node || !child || node.id === child.id || !child.parentId) {
    return false;
  }
  const parentNode = items[child.parentId];

  if (!parentNode) {
    return false;
  }

  if (parentNode.id === node.id) {
    return true;
  }

  return isParentNode({ node, child: parentNode, items });
}
