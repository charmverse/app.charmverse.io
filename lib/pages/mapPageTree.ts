import sortBy from 'lodash/sortBy';

import { DataNotFoundError } from 'lib/utilities/errors';

import type { PageNode, PageNodeWithChildren, PageTreeMappingInput, TargetPageTree } from './interfaces';

export function sortNodes <T> (nodes: PageNode<T>[]) {
  return [
    ...sortBy(nodes.filter(node => node.index >= 0), ['index', 'createdAt']),
    ...sortBy(nodes.filter(node => node.index < 0), ['createdAt'])
  ];
}

/**
 * @targetPageId If provided, the only root node returned will be the one whose child tree contains the target page ID
 * @includeCards - Defaults to false
 */
export function reducePagesToPageTree<
    T extends PageNode = PageNode> ({ items, rootPageIds, includeCards = false, includeDeletedPages, includeProposals }: Omit<PageTreeMappingInput<T>, 'targetPageId'>): { itemMap: { [key: string]: number }, itemsWithChildren: PageNodeWithChildren<T>[], rootNodes: PageNodeWithChildren<T>[] } {

  function includableNode (node: PageNode): boolean {
    if (!includeDeletedPages && node.deletedAt) {
      return false;
    }
    else if (!includeProposals && node.type === 'proposal') {
      return false;
    }
    else if (!includeCards && node.type === 'card') {
      return false;
    }
    else {
      return true;
    }
  }

  // Assign empty children to each node
  const tempItems: PageNodeWithChildren<T>[] = items.map((item: T) => {
    return {
      ...item,
      children: []
    };
  });

  // A map that contains the temp items array position for each page
  const map: { [key: string]: number } = {};
  let node: PageNodeWithChildren<T>;

  // Root pages will only be pushed here if rootPageIds is undefined, or if it is provided and the root page ID matches
  const roots = [];

  let i: number;
  for (i = 0; i < tempItems.length; i += 1) {
    map[tempItems[i].id] = i; // initialize the map
  }

  for (i = 0; i < tempItems.length; i += 1) {
    node = tempItems[i];
    const parentId = node.parentId;
    const parentIndex = parentId ? map[parentId] : -1;
    const parentNode = (typeof parentIndex === 'number' && parentIndex >= 0) ? tempItems[parentIndex] : undefined;

    if (parentNode && includableNode(node)) {
      parentNode.children.push(node);
      parentNode.children = sortNodes(parentNode.children);
    }
    // If it's a root page always show it
    else if ((node.parentId === null) && !rootPageIds && includableNode(node)) {
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
export function mapPageTree<
T extends PageNode = PageNode> ({ items, rootPageIds, includeDeletedPages, includeProposals = false }: Omit<PageTreeMappingInput<T>, 'targetPageId' | 'includeCards'>): PageNodeWithChildren<T>[] {
  const { rootNodes } = reducePagesToPageTree({ items, rootPageIds, includeCards: false, includeDeletedPages, includeProposals });

  return sortNodes(rootNodes);
}

/**
 * Given a list of pages, resolve only the tree specific to the target page
 * @return parents is the array of parent pages from nearest parent to the root. target page is the target page along with all child pages as a tree
 */
export function mapTargetPageTree<T extends PageNode = PageNode> ({ items, targetPageId, includeDeletedPages }: Omit<PageTreeMappingInput<T>, 'rootPageIds'> & { targetPageId: string }): TargetPageTree<T> {

  const { itemMap, itemsWithChildren } = reducePagesToPageTree({ items, includeCards: true, includeDeletedPages });

  /**
   * Goes from the page to its root, and generates a list of references corresponding to the path
   * @childIdChain A list of page IDs going from the target page to the first child of the root
   */
  function resolveRootId (currentNodeId: string, childIdChain: string[] = []): { rootId: string, childIdChain: string[] } {

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

      const childNode = currentNode.children.find(child => child.id === childId);

      if (!childNode) {
        throw new DataNotFoundError('Could not find the target child page');
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
export function flattenTree<T extends PageNode = PageNode> (node: PageNodeWithChildren<T>, flatNodes: PageNodeWithChildren<T>[] = []):
 PageNodeWithChildren<T>[] {

  node.children.forEach(childNode => {
    flatNodes.push(childNode);
    flattenTree(childNode, flatNodes);
  });

  return flatNodes;
}
