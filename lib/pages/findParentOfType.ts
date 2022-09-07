import { Page, PageType } from '@prisma/client';
import { TargetPageTree, PagesMap } from './interfaces';

export interface findParentOfTypeOptions {
  pageType: PageType;
  pageId?: string;
  pageMap?: PagesMap;
  targetPageTree?: TargetPageTree;
}

/**
 * Accepts a pagemap (used in the UI) or a target page tree (used in the server)
 * Traverses parents until a matching item is found
 * @returns
 */
export function findParentOfType ({ pageType, targetPageTree }: Required<Pick<findParentOfTypeOptions, 'pageType' | 'targetPageTree'>>): string | null
export function findParentOfType({ pageType, pageId, pageMap }: Required<Pick<findParentOfTypeOptions, 'pageType' | 'pageId' | 'pageMap'>>): string | null
export function findParentOfType ({ pageType, pageId, pageMap, targetPageTree }: findParentOfTypeOptions): string | null {

  if (pageMap) {
    let currentNode = pageMap[pageId as string];

    while (currentNode !== undefined) {
      const parentId = currentNode?.parentId;

      if (!parentId) {
        return null;
      }

      currentNode = pageMap[parentId];

      if (currentNode?.type === pageType) {
        return currentNode.id;
      }

    }

  }
  else if (targetPageTree) {

    const length = targetPageTree.parents.length;

    for (let i = length - 1; i >= 0; i--) {
      const parent = targetPageTree.parents[i];

      if (parent?.type === pageType) {
        return parent.id;
      }

    }
  }

  return null;

}
