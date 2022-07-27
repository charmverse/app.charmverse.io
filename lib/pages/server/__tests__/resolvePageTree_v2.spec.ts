/* eslint-disable camelcase */
import { Page, Space, User } from '@prisma/client';
import { createPage, generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';
import { PageNodeWithChildren } from '../../interfaces';
import { resolvePageTree } from '../resolvePageTree';

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
    spaceId: space.id
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
});
