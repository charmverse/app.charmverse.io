import type { PageType } from '@charmverse/core/prisma';

type Page = { type: PageType; id: string };

export interface FindParentOfTypeOptions<P extends Page> {
  pageType: PageType | PageType[];
  pageId?: string;
  pageMap?: Record<string, P | undefined>;
  targetPageTree?: { parents: Page[] };
}

function matcher({
  evaluatedPageType,
  searchPageType
}: {
  evaluatedPageType?: PageType;
  searchPageType: PageType | PageType[];
}) {
  if (!evaluatedPageType) {
    return false;
  }

  if (typeof searchPageType === 'object') {
    return searchPageType.includes(evaluatedPageType);
  }

  return searchPageType === evaluatedPageType;
}

type PageNodeRequiredFields = Page & { parentId?: string | null };

/**
 * Accepts a pagemap (used in the UI) or a target page tree (used in the server)
 * Traverses parents until a matching item is found
 * @returns
 */
export function findParentOfType<P extends PageNodeRequiredFields = PageNodeRequiredFields>({
  pageType,
  targetPageTree
}: Required<Pick<FindParentOfTypeOptions<P>, 'targetPageTree' | 'pageType'>>): string | null;
export function findParentOfType<P extends PageNodeRequiredFields = PageNodeRequiredFields>({
  pageType,
  pageId,
  pageMap
}: Required<Pick<FindParentOfTypeOptions<P>, 'pageType' | 'pageId' | 'pageMap'>>): string | null;
export function findParentOfType<P extends PageNodeRequiredFields = PageNodeRequiredFields>({
  pageType,
  pageId,
  pageMap,
  targetPageTree
}: FindParentOfTypeOptions<P>): string | null {
  if (pageMap) {
    let currentNode = pageMap[pageId as string];

    while (currentNode !== undefined) {
      const parentId = currentNode?.parentId;

      if (!parentId) {
        return null;
      }

      currentNode = pageMap[parentId];

      if (matcher({ evaluatedPageType: currentNode?.type, searchPageType: pageType })) {
        return currentNode?.id as string;
      }
    }
  } else if (targetPageTree) {
    const length = targetPageTree.parents.length;

    for (let i = 0; i < length; i++) {
      const parent = targetPageTree.parents[i];

      if (matcher({ evaluatedPageType: parent?.type, searchPageType: pageType })) {
        return parent.id;
      }
    }
  }

  return null;
}
