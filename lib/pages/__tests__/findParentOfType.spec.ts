/* eslint-disable camelcase */
import { generatePageNode } from 'testing/generate-stubs';

import { findParentOfType } from '../findParentOfType';
import type { PageNode, PagesMap, TargetPageTree } from '../interfaces';

const root_1 = generatePageNode({
  parentId: null,
  title: 'Root 1',
  index: 1,
  type: 'proposal'
});

const page_1_1 = generatePageNode({
  parentId: root_1.id,
  index: 1,
  title: 'Page 1.1',
  type: 'proposal'
});

const page_1_1_1 = generatePageNode({
  parentId: page_1_1.id,
  index: 1,
  title: 'Page 1.1.1'
});

const page_1_2 = generatePageNode({
  parentId: root_1.id,
  index: 2,
  title: 'Page 1.2'
});

// eslint-disable-next-line max-len
const pages: PageNode[] = [root_1, page_1_1, page_1_1_1, page_1_2];

const pagesMap: PagesMap<PageNode> = pages.reduce((acc, page) => {

  acc[page.id] = page;

  return acc;
}, {} as PagesMap<PageNode>);

// Tree with proposal
const page_1_1_1_Tree: TargetPageTree<PageNode> = {
  parents: [
    { ...page_1_1, children: [{ ...page_1_1_1, children: [] }] },
    { ...root_1, children: [{ ...page_1_1, children: [{ ...page_1_1_1, children: [] }] }] }
  ],
  targetPage: {
    ...page_1_1_1,
    children: []
  }
};

describe('findParentOfType', () => {
  it('should return the id of the closest parent node matching the given type, when given a pages map', () => {

    const result = findParentOfType({ pageType: 'proposal', pageId: page_1_1_1.id, pageMap: pagesMap });

    expect(result).toBe(page_1_1.id);
  });

  it('should return the id of the closest parent node matching the given type, when given a resolved page tree', () => {

    const result = findParentOfType({ pageType: 'proposal', targetPageTree: page_1_1_1_Tree });

    expect(result).toBe(page_1_1.id);
  });

  it('should return the id of the closest parent node matching the given type, when given a pages map', () => {

    const result = findParentOfType({ pageType: 'board', pageId: page_1_1_1.id, pageMap: pagesMap });

    expect(result).toBe(null);
  });

  it('should return the id of the closest parent node matching the given type, when given a resolved page tree', () => {

    const result = findParentOfType({ pageType: 'board', targetPageTree: page_1_1_1_Tree });

    expect(result).toBe(null);
  });
});
