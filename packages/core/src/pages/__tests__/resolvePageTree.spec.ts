/* eslint-disable camelcase */
import type { Page, Space, User } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { v4 } from 'uuid';

import { testUtilsPages, testUtilsUser } from '../../../test';
import { InvalidInputError } from '../../errors';
import type { PageNodeWithChildren, PageNodeWithPermissions, TargetPageTree } from '../interfaces';
import { multiResolvePageTree, resolvePageTree } from '../resolvePageTree';

let user: User;
let space: Space;

// Pages

let root_1: Page;
let page_1_1: Page;
let page_1_1_1: Page;
let page_1_1_1_1: Page;
let page_1_1_1_2: Page;
let page_1_1_2: Page;
let page_1_2: Page;
let page_1_2_1: Page;
let page_1_2_1_1: Page;

beforeAll(async () => {
  const generated = await testUtilsUser.generateUserAndSpace({ isAdmin: false });

  user = generated.user;
  space = generated.space;

  root_1 = await testUtilsPages.generatePage({
    parentId: null,
    title: 'Root 1',
    index: 1,
    createdBy: user.id,
    spaceId: space.id,
    content: { content: '' }
  });

  page_1_1 = await testUtilsPages.generatePage({
    parentId: root_1.id,
    index: 1,
    title: 'Page 1.1',
    createdBy: user.id,
    spaceId: space.id
  });

  page_1_1_1 = await testUtilsPages.generatePage({
    parentId: page_1_1.id,
    index: 1,
    title: 'Page 1.1.1',
    createdBy: user.id,
    spaceId: space.id
  });

  page_1_1_1_1 = await testUtilsPages.generatePage({
    parentId: page_1_1_1.id,
    index: 1,
    title: 'Page 1.1.1.1',
    createdBy: user.id,
    spaceId: space.id
  });

  page_1_1_1_2 = await testUtilsPages.generatePage({
    parentId: page_1_1_1.id,
    index: 1,
    title: 'Page 1.1.1.2',
    createdBy: user.id,
    spaceId: space.id
  });

  page_1_1_2 = await testUtilsPages.generatePage({
    parentId: page_1_1.id,
    index: 1,
    title: 'Page 1.1.2',
    createdBy: user.id,
    spaceId: space.id
  });

  page_1_2 = await testUtilsPages.generatePage({
    parentId: root_1.id,
    index: 2,
    title: 'Page 1.2',
    createdBy: user.id,
    spaceId: space.id
  });

  page_1_2_1 = await testUtilsPages.generatePage({
    parentId: page_1_2.id,
    index: 1,
    title: 'Page 1.2.1',
    createdBy: user.id,
    spaceId: space.id
  });

  page_1_2_1_1 = await testUtilsPages.generatePage({
    parentId: page_1_2_1.id,
    index: 1,
    title: 'Page 1.2.1.1',
    createdBy: user.id,
    spaceId: space.id
  });
});

// Reusable set of assertions to validate the shape of the tree from the root
function validateRootNode(node: PageNodeWithChildren) {
  expect(node.id).toBe(root_1.id);

  expect(node.children[0].id).toBe(page_1_1.id);
  expect(node.children[0].children[0].id).toBe(page_1_1_1.id);
  expect(node.children[0].children[0].children[0].id).toBe(page_1_1_1_1.id);
  expect(node.children[0].children[0].children[1].id).toBe(page_1_1_1_2.id);
  expect(node.children[0].children[1].id).toBe(page_1_1_2.id);
  expect(node.children[1].id).toBe(page_1_2.id);
  expect(node.children[1].children[0].id).toBe(page_1_2_1.id);
  expect(node.children[1].children[0].children[0].id).toBe(page_1_2_1_1.id);
}

/**
 * All tests related to handling recursion depend on the raw SQL query inside the page tree, and the handling of nodes inside reducePagesToPageTree method found at src/lib/pages/mapPageTree.ts
 */
describe('resolvePageTree', () => {
  it('should return the list of parents from closest to root, along with the page and its children', async () => {
    const { parents, targetPage } = await resolvePageTree({ pageId: page_1_1.id });

    // Manually list out the parent chain
    const parentList = [root_1];

    // Make sure we get parents in correct order
    for (let i = 0; i < parentList.length; i++) {
      expect(parents[i].id).toEqual(parentList[i].id);
    }

    expect(targetPage.id).toEqual(page_1_1.id);

    // Make sure the sorting by index also took place
    expect(targetPage.children[0].id).toBe(page_1_1_1.id);
    expect(targetPage.children[1].id).toBe(page_1_1_2.id);
  });

  it('should prune the parents so they each only contain one child, establishing a direct link to the page', async () => {
    const { parents, targetPage } = await resolvePageTree({ pageId: page_1_1_1.id });

    // Make sure we got correct page
    expect(targetPage.id).toEqual(page_1_1_1.id);

    // Manually list out the parent chain
    const parentList = [page_1_1, root_1];

    expect(parentList.length).toBe(parents.length);

    // Make sure we get parents in correct order
    for (let i = 0; i < parentList.length; i++) {
      expect(parents[i].id).toEqual(parentList[i].id);
    }

    // Make sure the parents have pruned children
    expect(parents[0].children.length).toBe(1);
    expect(parents[1].children.length).toBe(1);

    expect(parents[0].children[0].id).toBe(page_1_1_1.id);
    expect(parents[1].children[0].id).toBe(page_1_1.id);
  });

  it('should return an empty list of parents for a root page, along with the page and its children', async () => {
    const { parents, targetPage } = await resolvePageTree({ pageId: root_1.id });

    expect(parents.length).toBe(0);

    validateRootNode(targetPage);
  });

  it('should not return the full page content by default', async () => {
    const { targetPage } = await resolvePageTree({ pageId: root_1.id });

    expect(targetPage).not.toMatchObject(expect.objectContaining(root_1));
    expect((targetPage as any as Page).content).toBeUndefined();
  });

  it('should return the full page content if the full page option is passed', async () => {
    const { targetPage } = await resolvePageTree({ pageId: root_1.id, fullPage: true });

    expect(targetPage).toMatchObject(expect.objectContaining(root_1));
  });

  it('should ignore deleted pages by default', async () => {
    const rootPage = await testUtilsPages.generatePage({
      createdBy: user.id,
      spaceId: space.id
    });

    const childPage_1 = await testUtilsPages.generatePage({
      createdBy: user.id,
      spaceId: space.id,
      parentId: rootPage.id
    });

    const childPage_1_1 = await testUtilsPages.generatePage({
      createdBy: user.id,
      spaceId: space.id,
      parentId: childPage_1.id,
      deletedAt: new Date()
    });

    const childPage_1_1_1 = await testUtilsPages.generatePage({
      createdBy: user.id,
      spaceId: space.id,
      parentId: childPage_1_1.id,
      deletedAt: new Date()
    });

    const { parents, targetPage } = await resolvePageTree({ pageId: childPage_1.id });

    expect(parents.length).toBe(1);
    expect(parents[0].id).toBe(rootPage.id);

    expect(targetPage.children.length).toBe(0);
  });

  it('should include deleted pages if requested', async () => {
    const rootPage = await testUtilsPages.generatePage({
      createdBy: user.id,
      spaceId: space.id
    });

    const childPage_1 = await testUtilsPages.generatePage({
      createdBy: user.id,
      spaceId: space.id,
      parentId: rootPage.id
    });

    const childPage_1_1 = await testUtilsPages.generatePage({
      createdBy: user.id,
      spaceId: space.id,
      parentId: childPage_1.id,
      deletedAt: new Date()
    });

    const childPage_1_1_1 = await testUtilsPages.generatePage({
      createdBy: user.id,
      spaceId: space.id,
      parentId: childPage_1_1.id,
      deletedAt: new Date()
    });

    const { parents, targetPage } = await resolvePageTree({ pageId: childPage_1.id, includeDeletedPages: true });

    expect(parents.length).toBe(1);
    expect(parents[0].id).toBe(rootPage.id);

    expect(targetPage.children.length).toBe(1);
    expect(targetPage.children[0].id).toBe(childPage_1_1.id);

    expect(targetPage.children[0].children.length).toBe(1);
    expect(targetPage.children[0].children[0].id).toBe(childPage_1_1_1.id);
  });

  it.skip('should handle a page that references itself without an infinite recursion timeout', async () => {
    const pageId = v4();

    const selfReferencingNode = await testUtilsPages.generatePage({
      id: pageId,
      parentId: pageId,
      index: 2,
      title: 'Self-referencing',
      createdBy: user.id,
      spaceId: space.id
    });

    const { parents, targetPage } = await resolvePageTree({
      pageId
    });

    expect(targetPage.id).toBe(selfReferencingNode.id);
    expect(targetPage.children.length).toBe(0);
    expect(parents.length).toBe(0);
  });

  // skipping this test, which is now prevented via by the foreign-key relationship in the db schema
  it.skip('should drop a circular reference between two nodes without an infinite recursion timeout', async () => {
    const firstPageId = v4();
    const parentPage = v4();

    const secondNode = await testUtilsPages.generatePage({
      id: parentPage,
      parentId: firstPageId,
      index: 2,
      title: 'Circular 2',
      createdBy: user.id,
      spaceId: space.id
    });

    const firstNode = await testUtilsPages.generatePage({
      id: firstPageId,
      parentId: parentPage,
      index: 2,
      title: 'Circular 1',
      createdBy: user.id,
      spaceId: space.id
    });
    // Test in both directions
    const { parents: secondNodeParents, targetPage: secondNodePage } = await resolvePageTree({
      pageId: secondNode.id
    });

    expect(secondNodePage.id).toBe(secondNode.id);
    expect(secondNodePage.children.length).toBe(1);
    expect(secondNodePage.children[0].id).toBe(firstNode.id);
    expect(secondNodeParents.length).toBe(0);

    const { parents: firstNodeParents, targetPage: firstNodePage } = await resolvePageTree({
      pageId: firstNode.id
    });

    expect(firstNodePage.id).toBe(firstNodePage.id);
    expect(firstNodePage.children.length).toBe(0);
    expect(firstNodeParents.length).toBe(1);
    expect(firstNodeParents[0].id).toBe(secondNode.id);
  });
});
/**
 * All tests related to handling recursion depend on the raw SQL query inside the page tree, and the handling of nodes inside reducePagesToPageTree method found at src/lib/pages/mapPageTree.ts
 */
describe('multiResolvePageTree', () => {
  it('should return the target page tree for each page in a record with the page ids as key', async () => {
    const { space: space1, user: user1 } = await testUtilsUser.generateUserAndSpace();

    const page1 = await testUtilsPages.generatePage({
      createdBy: user1.id,
      spaceId: space1.id
    });

    const page2 = await testUtilsPages.generatePage({
      createdBy: user1.id,
      spaceId: space1.id
    });

    const result = await multiResolvePageTree({ pageIds: [page1.id, page2.id] });

    expect(result[page1.id]?.targetPage.id).toBe(page1.id);

    expect(result[page2.id]?.targetPage.id).toBe(page2.id);
  });

  it('should return null if resolution failed for a specific page', async () => {
    const { space: space1, user: user1 } = await testUtilsUser.generateUserAndSpace();

    const page1 = await testUtilsPages.generatePage({
      createdBy: user1.id,
      spaceId: space1.id
    });

    const page1Child = await testUtilsPages.generatePage({
      createdBy: user1.id,
      spaceId: space1.id,
      parentId: page1.id
    });

    const inexistentPageId = v4();

    const result = await multiResolvePageTree({ pageIds: [page1.id, inexistentPageId], flattenChildren: true });

    expect(result[page1.id]?.targetPage.id).toBe(page1.id);
    expect(result[page1.id]?.flatChildren[0].id).toBe(page1Child.id);

    expect(result[inexistentPageId]).toBeNull();
  });

  it('should not flatten children by default', async () => {
    const { space: space1, user: user1 } = await testUtilsUser.generateUserAndSpace();

    const page1 = await testUtilsPages.generatePage({
      createdBy: user1.id,
      spaceId: space1.id
    });

    const page1Child = await testUtilsPages.generatePage({
      createdBy: user1.id,
      spaceId: space1.id,
      parentId: page1.id
    });

    const inexistentPageId = v4();

    const result = await multiResolvePageTree({ pageIds: [page1.id, inexistentPageId] });

    expect((result[page1.id] as any).flatChildren).toBeUndefined();
    // Make sure normal tree still got resolved
    expect(result[page1.id]?.targetPage.children[0].id).toBe(page1Child.id);
  });

  it('should fail if the pages are in a separate space', async () => {
    const { space: space1, user: user1 } = await testUtilsUser.generateUserAndSpace();
    const { space: space2, user: user2 } = await testUtilsUser.generateUserAndSpace();

    const page1 = await testUtilsPages.generatePage({
      createdBy: user1.id,
      spaceId: space1.id
    });

    const page2 = await testUtilsPages.generatePage({
      createdBy: user2.id,
      spaceId: space2.id
    });

    await expect(multiResolvePageTree({ pageIds: [page1.id, page2.id] })).rejects.toBeInstanceOf(InvalidInputError);
  });

  it.skip('should handle a page that references itself without an infinite recursion timeout', async () => {
    const pageId = v4();

    const selfReferencingNode = await testUtilsPages.generatePage({
      id: pageId,
      parentId: pageId,
      index: 2,
      title: 'Self-referencing',
      createdBy: user.id,
      spaceId: space.id
    });

    const result = await multiResolvePageTree({
      pageIds: [pageId]
    });

    expect(Object.keys(result).length).toBe(1);

    const { parents, targetPage } = result[pageId] as TargetPageTree<PageNodeWithPermissions>;

    expect(targetPage.id).toBe(pageId);

    expect(targetPage.children.length).toBe(0);
    expect(parents.length).toBe(0);
  });

  it.skip('should drop a circular reference between two nodes without an infinite recursion timeout', async () => {
    const firstPageId = v4();
    const secondPageId = v4();

    const firstNode = await testUtilsPages.generatePage({
      id: firstPageId,
      parentId: secondPageId,
      index: 2,
      title: 'Circular 1',
      createdBy: user.id,
      spaceId: space.id
    });

    const secondNode = await testUtilsPages.generatePage({
      id: secondPageId,
      parentId: firstPageId,
      index: 2,
      title: 'Circular 2',
      createdBy: user.id,
      spaceId: space.id
    });

    const result = await multiResolvePageTree({
      pageIds: [firstNode.id, secondNode.id]
    });

    // Test in both directions
    const { parents: secondNodeParents, targetPage: secondNodePage } = result[
      secondNode.id
    ] as TargetPageTree<PageNodeWithPermissions>;

    const { parents: firstNodeParents, targetPage: firstNodePage } = result[
      firstNode.id
    ] as TargetPageTree<PageNodeWithPermissions>;

    expect(secondNodePage.id).toBe(secondNode.id);
    expect(secondNodePage.children.length).toBe(1);
    expect(secondNodePage.children[0].id).toBe(firstNode.id);
    expect(secondNodeParents.length).toBe(0);

    expect(firstNodePage.id).toBe(firstNodePage.id);
    expect(firstNodePage.children.length).toBe(0);
    expect(firstNodeParents.length).toBe(1);
    expect(firstNodeParents[0].id).toBe(secondNode.id);
  });
});
