/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable camelcase */
import fs from 'node:fs/promises';

import type { Page, Space, User } from '@prisma/client';

import { createBounty } from 'lib/bounties';
import type { IPageWithPermissions } from 'lib/pages';
import { createPage, generateBoard, generateProposal, generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';

import { exportWorkspacePages } from '../exportWorkspacePages';

jest.mock('node:fs/promises');

let space: Space;
let user: User;
let root_1: IPageWithPermissions;
let page_1_1: IPageWithPermissions;
let page_1_1_1: IPageWithPermissions;
let boardPage: Page;

beforeAll(async () => {
  const generated = await generateUserAndSpaceWithApiToken();
  space = generated.space;
  user = generated.user;

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

  boardPage = await generateBoard({
    spaceId: space.id,
    createdBy: user.id
  });
});

describe('exportWorkspacePages', () => {

  it('should export the pages within a workspace to a list of root pages, and their children as a recursive tree structure', async () => {

    const { data } = await exportWorkspacePages({
      sourceSpaceIdOrDomain: space.id
    });

    // Only 2 root level pages
    expect(data.pages.length).toBe(2);

    // Verify tree structure
    const exportedRoot1 = data.pages.find(page => page.id === root_1.id);
    expect(exportedRoot1).toBeTruthy();

    expect(exportedRoot1?.children.length).toBe(1);
    expect(exportedRoot1?.children[0].id).toBe(page_1_1.id);

    expect(exportedRoot1?.children[0].children.length).toBe(1);
    expect(exportedRoot1?.children[0].children[0].id).toBe(page_1_1_1.id);

    const exportedBoardPage = data.pages.find(page => page.id === boardPage.id);
    expect(exportedBoardPage).toBeTruthy();
  });

  it('should support a space domain for the source space', async () => {

    const { data } = await exportWorkspacePages({
      sourceSpaceIdOrDomain: space.domain
    });

    // Copy paste all assertions from the first test which uses space ID
    // Only 2 root level pages
    expect(data.pages.length).toBe(2);

    // Verify tree structure
    const exportedRoot1 = data.pages.find(page => page.id === root_1.id);
    expect(exportedRoot1).toBeTruthy();

    expect(exportedRoot1?.children.length).toBe(1);
    expect(exportedRoot1?.children[0].id).toBe(page_1_1.id);

    expect(exportedRoot1?.children[0].children.length).toBe(1);
    expect(exportedRoot1?.children[0].children[0].id).toBe(page_1_1_1.id);

    const exportedBoardPage = data.pages.find(page => page.id === boardPage.id);
    expect(exportedBoardPage).toBeTruthy();
  });

  it('should save the block data for boards and cards inside their respective pages', async () => {
    const { data } = await exportWorkspacePages({
      sourceSpaceIdOrDomain: space.id
    });

    const exportedBoardPage = data.pages.find(page => page.id === boardPage.id)!;

    expect(exportedBoardPage.blocks?.board!.id).toBe(exportedBoardPage.id);
    expect((exportedBoardPage.blocks?.views?.length ?? 0) >= 1).toBe(true);
    expect(exportedBoardPage.blocks?.card).toBeUndefined();

    exportedBoardPage.children.forEach(cardPage => {
      expect(cardPage.blocks?.card!.id).toBe(cardPage.id);
      expect(cardPage.blocks?.board).toBeUndefined();
      expect(cardPage.blocks?.views).toBeUndefined();
    });
  });

  it('should ignore deleted pages', async () => {

    const { space: spaceWithDeletedPage, user: _user } = await generateUserAndSpaceWithApiToken();

    await createPage({
      parentId: null,
      title: 'Root 1',
      index: 1,
      createdBy: _user.id,
      spaceId: spaceWithDeletedPage.id,
      deletedAt: new Date()
    });

    const returnedPage = await createPage({
      parentId: null,
      title: 'Root 1',
      index: 1,
      createdBy: _user.id,
      spaceId: spaceWithDeletedPage.id
    });

    const { data } = await exportWorkspacePages({
      sourceSpaceIdOrDomain: spaceWithDeletedPage.id
    });

    expect(data.pages.length).toBe(1);
    expect(data.pages[0].id).toBe(returnedPage.id);

  });

  it('should ignore bounties', async () => {
    const { space: spaceWithDeletedPage, user: _user } = await generateUserAndSpaceWithApiToken();

    await createBounty({
      createdBy: _user.id,
      spaceId: spaceWithDeletedPage.id
    });

    const returnedPage = await createPage({
      parentId: null,
      title: 'Root 1',
      index: 1,
      createdBy: _user.id,
      spaceId: spaceWithDeletedPage.id
    });

    const { data } = await exportWorkspacePages({
      sourceSpaceIdOrDomain: spaceWithDeletedPage.id
    });

    expect(data.pages.length).toBe(1);
    expect(data.pages[0].id).toBe(returnedPage.id);
  });

  it('should ignore proposals', async () => {
    const { space: spaceWithDeletedPage, user: _user } = await generateUserAndSpaceWithApiToken();

    await generateProposal({
      authors: [_user.id],
      spaceId: spaceWithDeletedPage.id,
      proposalStatus: 'discussion',
      userId: _user.id,
      reviewers: []
    });

    const returnedPage = await createPage({
      parentId: null,
      title: 'Root 1',
      index: 1,
      createdBy: _user.id,
      spaceId: spaceWithDeletedPage.id
    });

    const { data } = await exportWorkspacePages({
      sourceSpaceIdOrDomain: spaceWithDeletedPage.id
    });

    expect(data.pages.length).toBe(1);
    expect(data.pages[0].id).toBe(returnedPage.id);
  });

  it('should write the export to the given filename if provided', async () => {
    const exportName = 'test-export';

    const { data, path: exportedPath } = await exportWorkspacePages({
      sourceSpaceIdOrDomain: space.id,
      exportName
    });

    const stringifiedData = JSON.stringify(data, null, 2);
    expect(fs.writeFile).toHaveBeenCalledWith(exportedPath, stringifiedData);
  });

});
