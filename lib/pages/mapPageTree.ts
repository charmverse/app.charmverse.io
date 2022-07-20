import { DataNotFoundError } from 'lib/utilities/errors';
import { RequiredNotNull } from 'lib/utilities/types';
import sortBy from 'lodash/sortBy';
import { PageNode, PageNodeWithChildren, PageTreeMappingInput, TargetPageTree } from './interfaces';

export const sortNodes = (nodes: Array<PageNode>) => {
  return [
    ...sortBy(nodes.filter(node => node.index >= 0), ['index', 'createdAt']),
    ...sortBy(nodes.filter(node => node.index < 0), ['createdAt'])
  ];
};

/**
 * @targetPageId If provided, the only root node returned will be the one whose child tree contains the target page ID
 */
function reducePagesToPageTree<
    T extends PageNode = PageNode, R extends PageNodeWithChildren = PageNodeWithChildren
    > ({ items, rootPageIds }: Omit<PageTreeMappingInput<T>, 'targetPageId'>): {itemMap: { [key: string]: number}, itemsWithChildren: R[], rootNodes: R[]} {

  // Assign empty children to each node
  const tempItems: R[] = items.map((item: T) => {
    return {
      ...item,
      children: []
    } as any as R;
  });

  // A map that contains the temp items array position for each page
  const map: { [key: string]: number } = {};
  let node: R;

  // Root pages will only be pushed here if rootPageIds is undefined, or if it is provided and the root page ID matches
  const roots = [];

  let i: number;
  for (i = 0; i < tempItems.length; i += 1) {
    map[tempItems[i].id] = i; // initialize the map
  }

  for (i = 0; i < tempItems.length; i += 1) {
    node = tempItems[i];
    const parentIndex = node.parentId;
    const index = parentIndex ? map[parentIndex] : -1;

    if (node.parentId && tempItems[index] && node.deletedAt === null) {
      // Make sure its not a database page or a focalboard card
      if (tempItems[index].type === 'page') {
        tempItems[index].children.push(node);
        tempItems[index].children = sortNodes(tempItems[index].children) as R[];
      }
    }
    // If it's a root page always show it
    else if ((node.parentId === null) && !rootPageIds && node.deletedAt === null) {
      roots.push(node);
    }
    else if (rootPageIds?.includes(node.id)) {
      roots.push(node);
    }
  }

  return {
    itemMap: map,
    rootNodes: roots,
    itemsWithChildren: tempItems
  };

}

export function mapPageTree<
T extends PageNode = PageNode, R extends PageNodeWithChildren = PageNodeWithChildren
> ({ items, rootPageIds }: Omit<PageTreeMappingInput<T>, 'targetPageId'>): R[] {
  const { rootNodes } = reducePagesToPageTree({ items, rootPageIds });

  return sortNodes(rootNodes) as R[];
}

/**
 * Given a list of pages, resolve only the tree specific to the target page
 * @return parents is the array of parent pages from nearest parent to the root. target page is the target page along with all child pages as a tree
 */
export function mapTargetPageTree<T extends PageNode = PageNode, R extends PageNodeWithChildren = PageNodeWithChildren> ({ items, targetPageId }: Omit<PageTreeMappingInput<T>, 'rootPageIds'> & {targetPageId: string}): TargetPageTree<R> {

  const { itemMap, itemsWithChildren } = reducePagesToPageTree({ items });

  /**
   * Goes from the page to its root, and generates a list of references corresponding to the path
   * @childIdChain A list of page IDs going from the target page to the first child of the root
   */
  function resolveRootId (currentNodeId: string, childIdChain: string[] = []): {rootId: string, childIdChain: string[]} {

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

  const parents: R[] = [];

  if (rootNode.id !== targetPageId) {

    const childIdChainFromRootChild = childIdChain.reverse();

    let currentNode = rootNode as R;

    for (const childId of childIdChainFromRootChild) {

      parents.push(currentNode);

      const childNode = currentNode.children.find(child => child.id === childId);

      if (!childNode) {
        throw new DataNotFoundError('Could not find the target child page');
      }

      currentNode = childNode as R;
    }
  }

  const targetPageNode = itemsWithChildren[itemMap[targetPageId]];

  return {
    // Parents were resolved from the root, but we need to return them from the closest to the page
    parents: parents.reverse(),
    targetPage: targetPageNode as R
  };

}
