/* eslint-disable camelcase */
import type { Page, Space, User } from '@prisma/client';
import { v4 } from 'uuid';

import { InvalidInputError } from 'lib/utilities/errors';
import { createPage, generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';

import type { PageNodeWithChildren } from '../../interfaces';
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

  const generated = await generateUserAndSpaceWithApiToken(undefined, false);

  user = generated.user;
  space = generated.space;

  root_1 = await createPage({
    parentId: null,
    title: 'Root 1',
    index: 1,
    createdBy: user.id,
    spaceId: space.id,
    content: { content: '' }
  });

  page_1_1 = await createPage({
    parentId: root_1.id,
    index: 1,
    title: 'Page 1.1',
    createdBy: user.id,
    spaceId: space.id
  });

  page_1_1_1 = await createPage({
    parentId: page_1_1.id,
    index: 1,
    title: 'Page 1.1.1',
    createdBy: user.id,
    spaceId: space.id
  });

  page_1_1_1_1 = await createPage({
    parentId: page_1_1_1.id,
    index: 1,
    title: 'Page 1.1.1.1',
    createdBy: user.id,
    spaceId: space.id
  });

  page_1_1_1_2 = await createPage({
    parentId: page_1_1_1.id,
    index: 1,
    title: 'Page 1.1.1.2',
    createdBy: user.id,
    spaceId: space.id
  });

  page_1_1_2 = await createPage({
    parentId: page_1_1.id,
    index: 1,
    title: 'Page 1.1.2',
    createdBy: user.id,
    spaceId: space.id
  });

  page_1_2 = await createPage({
    parentId: root_1.id,
    index: 2,
    title: 'Page 1.2',
    createdBy: user.id,
    spaceId: space.id
  });

  page_1_2_1 = await createPage({
    parentId: page_1_2.id,
    index: 1,
    title: 'Page 1.2.1',
    createdBy: user.id,
    spaceId: space.id
  });

  page_1_2_1_1 = await createPage({
    parentId: page_1_2_1.id,
    index: 1,
    title: 'Page 1.2.1.1',
    createdBy: user.id,
    spaceId: space.id
  });

});

// Reusable set of assertions to validate the shape of the tree from the root
function validateRootNode (node: PageNodeWithChildren) {
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

    const rootPage = await createPage({
      createdBy: user.id,
      spaceId: space.id
    });

    const childPage_1 = await createPage({
      createdBy: user.id,
      spaceId: space.id,
      parentId: rootPage.id
    });

    const childPage_1_1 = await createPage({
      createdBy: user.id,
      spaceId: space.id,
      parentId: childPage_1.id,
      deletedAt: new Date()
    });

    const childPage_1_1_1 = await createPage({
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
    const rootPage = await createPage({
      createdBy: user.id,
      spaceId: space.id
    });

    const childPage_1 = await createPage({
      createdBy: user.id,
      spaceId: space.id,
      parentId: rootPage.id
    });

    const childPage_1_1 = await createPage({
      createdBy: user.id,
      spaceId: space.id,
      parentId: childPage_1.id,
      deletedAt: new Date()
    });

    const childPage_1_1_1 = await createPage({
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
});

describe('multiResolvePageTree', () => {

  it('should return the target page tree for each page in a record with the page ids as key', async () => {
    const { space: space1, user: user1 } = await generateUserAndSpaceWithApiToken();

    const page1 = await createPage({
      createdBy: user1.id,
      spaceId: space1.id
    });

    const page2 = await createPage({
      createdBy: user1.id,
      spaceId: space1.id
    });

    const result = await multiResolvePageTree({ pageIds: [page1.id, page2.id] });

    expect(result[page1.id]?.targetPage.id).toBe(page1.id);

    expect(result[page2.id]?.targetPage.id).toBe(page2.id);
  });

  it('should return null if resolution failed for a specific page', async () => {

    const { space: space1, user: user1 } = await generateUserAndSpaceWithApiToken();

    const page1 = await createPage({
      createdBy: user1.id,
      spaceId: space1.id
    });

    const page1Child = await createPage({
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

    const { space: space1, user: user1 } = await generateUserAndSpaceWithApiToken();

    const page1 = await createPage({
      createdBy: user1.id,
      spaceId: space1.id
    });

    const page1Child = await createPage({
      createdBy: user1.id,
      spaceId: space1.id,
      parentId: page1.id
    });

    const inexistentPageId = v4();

    const result = await multiResolvePageTree({ pageIds: [page1.id, inexistentPageId] });

    expect((result[page1.id] as any).flatChildren).toBeUndefined();
    // Make sure normal tree still got resolved
    expect((result[page1.id])?.targetPage.children[0].id).toBe(page1Child.id);

  });

  it('should fail if the pages are in a separate space', async () => {
    const { space: space1, user: user1 } = await generateUserAndSpaceWithApiToken();
    const { space: space2, user: user2 } = await generateUserAndSpaceWithApiToken();

    const page1 = await createPage({
      createdBy: user1.id,
      spaceId: space1.id
    });

    const page2 = await createPage({
      createdBy: user2.id,
      spaceId: space2.id
    });

    await expect(multiResolvePageTree({ pageIds: [page1.id, page2.id] })).rejects.toBeInstanceOf(InvalidInputError);

  });
});
