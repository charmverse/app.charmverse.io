/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable camelcase */
import fs from 'node:fs/promises';

import type { Page, Space, User } from '@prisma/client';
import { v4 } from 'uuid';

import { prisma } from 'db';
import type { IPageWithPermissions } from 'lib/pages';
import { createPage, generateBoard, generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';

import { exportWorkspacePages } from '../exportWorkspacePages';
import { importWorkspacePages } from '../importWorkspacePages';

jest.mock('node:fs/promises');

let space: Space;
let user: User;
let root_1: IPageWithPermissions;
let page_1_1: IPageWithPermissions;
let page_1_1_1: IPageWithPermissions;
let boardPage: Page;
let totalSourcePages = 0;
let totalSourceBlocks = 0;

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

  totalSourcePages = await prisma.page.count({
    where: {
      spaceId: space.id
    }
  });

  totalSourceBlocks = await prisma.block.count({
    where: {
      spaceId: space.id
    }
  });
});

describe('importWorkspacePages', () => {
  it('should import data from the export function into the target workspace', async () => {

    const { space: targetSpace } = await generateUserAndSpaceWithApiToken();

    const { data } = await exportWorkspacePages({
      sourceSpaceIdOrDomain: space.domain
    });

    await importWorkspacePages({
      targetSpaceIdOrDomain: targetSpace.domain,
      exportData: data
    });

    const pages = await prisma.page.findMany({
      where: {
        spaceId: targetSpace.id
      }
    });

    const blocks = await prisma.block.findMany({
      where: {
        spaceId: targetSpace.id
      }
    });

    expect(pages.length).toBe(totalSourcePages);
    expect(blocks.length).toBe(totalSourceBlocks);

  });

  it('should accept a filename as the source data input', async () => {
    const { space: targetSpace } = await generateUserAndSpaceWithApiToken();

    const exportName = `test-${v4()}`;

    const { data, path } = await exportWorkspacePages({
      sourceSpaceIdOrDomain: space.domain,
      exportName
    });

    const stringifiedData = JSON.stringify(data, null, 2);
    jest.spyOn(fs, 'readFile').mockImplementation(() => Promise.resolve(stringifiedData));

    await importWorkspacePages({
      targetSpaceIdOrDomain: targetSpace.domain,
      exportName
    });

    const pages = await prisma.page.findMany({
      where: {
        spaceId: targetSpace.id
      }
    });

    const blocks = await prisma.block.findMany({
      where: {
        spaceId: targetSpace.id
      }
    });

    expect(fs.readFile).toHaveBeenCalledWith(path, 'utf-8');
    expect(pages.length).toBe(totalSourcePages);
    expect(blocks.length).toBe(totalSourceBlocks);
  });
});
