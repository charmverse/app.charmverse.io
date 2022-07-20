/* eslint-disable camelcase */
import { Page, Space, User } from '@prisma/client';
import { generatePageNode, generatePageToCreateStub } from 'testing/generate-stubs';
import { generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';
import { PageNode, PageNodeWithChildren } from '../interfaces';
import { mapTargetPageTree, mapPageTree } from '../mapPageTree';

const root_1 = generatePageNode({
  parentId: null,
  title: 'Root 1',
  index: 1
});

const page_1_1 = generatePageNode({
  parentId: root_1.id,
  index: 1,
  title: 'Page 1.1'
});

const page_1_1_1 = generatePageNode({
  parentId: page_1_1.id,
  index: 1,
  title: 'Page 1.1.1'
});

const page_1_1_1_1 = generatePageNode({
  parentId: page_1_1_1.id,
  index: 1,
  title: 'Page 1.1.1.1'
});

const page_1_1_1_2 = generatePageNode({
  parentId: page_1_1_1.id,
  index: 2,
  title: 'Page 1.1.1.2'
});

const page_1_1_2 = generatePageNode({
  parentId: page_1_1.id,
  index: 2,
  title: 'Page 1.1.2'
});

const page_1_2 = generatePageNode({
  parentId: root_1.id,
  index: 2,
  title: 'Page 1.2'
});

const page_1_2_1 = generatePageNode({
  parentId: page_1_2.id,
  index: 1,
  title: 'Page 1.2.1'
});

const page_1_2_1_1 = generatePageNode({
  parentId: page_1_2_1.id,
  index: 1,
  title: 'Page 1.2.1.1'
});

const page_1_3 = generatePageNode({
  parentId: root_1.id,
  index: 3,
  title: 'Page 1.3'
});

const root_2 = generatePageNode({
  parentId: null,
  index: 2,
  title: 'Root 2'
});

const page_2_1 = generatePageNode({
  parentId: root_2.id,
  index: 1,
  title: 'Page 2.1'
});

const page_2_1_1 = generatePageNode({
  parentId: page_2_1.id,
  index: 1,
  title: 'Page 2.1.1'
});

const page_2_1_1_1 = generatePageNode({
  parentId: page_2_1_1.id,
  index: 1,
  title: 'Page 2.1.1.1'
});

const page_2_1_1_2 = generatePageNode({
  parentId: page_2_1_1.id,
  index: 2,
  title: 'Page 2.1.1.2'
});

const page_2_1_2 = generatePageNode({
  parentId: page_2_1.id,
  index: 2,
  title: 'Page 2.1.2'
});

const page_2_2 = generatePageNode({
  parentId: root_2.id,
  index: 2,
  title: 'Page 2.2'
});

const page_2_2_1 = generatePageNode({
  parentId: page_2_2.id,
  index: 1,
  title: 'Page 2.2.1'
});

const page_2_2_1_1 = generatePageNode({
  parentId: page_2_2_1.id,
  index: 1,
  title: 'Page 2.2.1.1'
});

const page_2_3 = generatePageNode({
  parentId: root_2.id,
  index: 3,
  title: 'Page 2.3'
});

// eslint-disable-next-line max-len
const pages: PageNode[] = [root_1, page_1_1, page_1_1_1, page_1_1_1_1, page_1_1_1_2, page_1_1_2, page_1_2, page_1_2_1, page_1_2_1_1, page_1_3, root_2, page_2_1, page_2_1_1, page_2_1_1_1, page_2_1_1_2, page_2_1_2, page_2_2, page_2_2_1, page_2_2_1_1, page_2_3];

/**
 * Reusable set of assertions for verifying root_1 tree
 * */
function validateRootOne (node: PageNodeWithChildren) {
  expect(node.id).toBe(root_1.id);

  // Test the entire tree
  // First subtree
  expect(node.children[0].id).toBe(page_1_1.id);
  expect(node.children[0].children[0].id).toBe(page_1_1_1.id);
  expect(node.children[0].children[0].children[0].id).toBe(page_1_1_1_1.id);
  expect(node.children[0].children[0].children[1].id).toBe(page_1_1_1_2.id);
  expect(node.children[0].children[1].id).toBe(page_1_1_2.id);

  // Second subtree
  expect(node.children[1].id).toBe(page_1_2.id);
  expect(node.children[1].children[0].id).toBe(page_1_2_1.id);
  expect(node.children[1].children[0].children[0].id).toBe(page_1_2_1_1.id);

  // Third subtree
  expect(node.children[2].id).toBe(page_1_3.id);
}

describe('mapPageTree', () => {

  it('should map a list of pages to a tree', async () => {
    const rootList = mapPageTree({
      items: pages
    });

    expect(rootList.length).toBe(2);

    validateRootOne(rootList[0]);

  });

  it('should only return the selected root nodes if this is provided as a parameter', async () => {
    const rootList = mapPageTree({
      items: pages,
      rootPageIds: [root_1.id]
    });

    expect(rootList.length).toBe(1);

    validateRootOne(rootList[0]);

  });

  it('should consider a page as root-level if it has a parentId, but this parent does not exist', async () => {

    // Page 1.1.1 will not be linkable to Root 1, so it should be considered a root-level page
    const pagesWithMissingLink = pages.filter(p => p.id !== page_1_1.id);

    const rootList = mapPageTree({
      items: pagesWithMissingLink
    });

    expect(rootList.length).toBe(3);

    expect(rootList.some(r => r.id === root_1.id));
    expect(rootList.some(r => r.id === page_1_1_1.id));
    expect(rootList.some(r => r.id === root_2.id));

    const rootNode = rootList.find(r => r.id === root_1.id) as PageNodeWithChildren;

    validateRootOne(rootNode);

  });
});

describe('mapTargetPageTree', () => {

  it('should return the list of parents from closest to root, along with the page and its children', () => {
    const { parents, targetPage } = mapTargetPageTree({ targetPageId: page_1_1_1.id, items: pages });

    const parentList = [page_1_1, root_1];

    // Make sure we get parents in correct order
    for (let i = 0; i < parentList.length; i++) {
      expect(parents[i].id).toEqual(parentList[i].id);
    }

    expect(targetPage.id).toEqual(page_1_1_1.id);

    // Make sure the sorting by index also took place
    expect(targetPage.children[0].id).toBe(page_1_1_1_1.id);
    expect(targetPage.children[1].id).toBe(page_1_1_1_2.id);
  });

  it('should return an empty list of parents for a root page, along with the page and its children', () => {
    const { parents, targetPage } = mapTargetPageTree({ targetPageId: root_1.id, items: pages });

    expect(parents.length).toBe(0);

    validateRootOne(targetPage);

  });
});
