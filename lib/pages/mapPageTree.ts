import sortBy from 'lodash/sortBy';
import { PageNode, PageNodeWithChildren, PageTreeMappingInput } from './interfaces';

export const sortNodes = (nodes: Array<PageNode>) => {
  return [
    ...sortBy(nodes.filter(node => node.index >= 0), ['index', 'createdAt']),
    ...sortBy(nodes.filter(node => node.index < 0), ['createdAt'])
  ];
};

/**
 * @targetPageId If provided, the only root node returned will be the one whose child tree contains the target page ID
 *
 * @abstract If target page id is provided, the meaning of the returned values changes. The first value will be the root node and the second value will be the target page node. The tree between root node and target node will be pruned so that the children array only contains a single child node. The target node and below retain their children
 */
export function mapPageTree<
    T extends PageNode = PageNode, R extends PageNodeWithChildren = PageNodeWithChildren
    > ({ items, rootPageIds, targetPageId }: PageTreeMappingInput<T>): R[] {

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
    // If its a root page always show it
    else if ((node.parentId === null) && !rootPageIds && node.deletedAt === null) {
      roots.push(node);
    }
    if (rootPageIds?.includes(node.id)) {
      roots.push(node);
    }
  }

  // Only used when we pass a target page id
  function resolveRootId (currentNodeId: string, childIdChain: string[] = []): {rootId: string, childIdChain: string[]} {
    const currentNode = tempItems[map[currentNodeId]];

    const parentId = currentNode.parentId;

    // If the parent does not exist, consider current node as the root
    if (!parentId || !tempItems[map[currentNodeId]]) {
      return {
        rootId: currentNodeId,
        // Reverse so we start with the top most child
        childIdChain: childIdChain.reverse()
      };
    }

    childIdChain.push(currentNodeId);

    return resolveRootId(parentId, childIdChain);
  }

  if (targetPageId) {

    const targetPageNode = tempItems[map[targetPageId]];

    const { childIdChain, rootId } = resolveRootId(targetPageId);

    const rootNode = tempItems[map[rootId]];

    childIdChain.reduce((currentNode, childId) => {
      currentNode.children = currentNode.children.filter(childNode => childNode.id === childId);
      return currentNode.children[0] as R;
    }, rootNode);

    return [rootNode, targetPageNode];

  }
  else {
    return sortNodes(roots) as R[];
  }

}
