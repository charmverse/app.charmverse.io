/* eslint-disable camelcase */
import fs from 'node:fs/promises';

import type { PageWithPermissions } from '@charmverse/core/pages';
import type { Page, Space, User } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { testUtilsProposals, testUtilsUser } from '@charmverse/core/test';
import { v4 } from 'uuid';

import { prismaToBlock } from 'lib/focalboard/block';
import type { Board } from 'lib/focalboard/board';
import { createPage, generateBoard, generateUserAndSpace } from 'testing/setupDatabase';

import { exportWorkspacePages, exportWorkspacePagesToDisk } from '../exportWorkspacePages';
import { importWorkspacePages } from '../importWorkspacePages';

jest.mock('node:fs/promises');

let space: Space;
let user: User;
let root_1: PageWithPermissions;
let page_1_1: PageWithPermissions;
let page_1_1_1: PageWithPermissions;
let boardPage: Page;
let cardPages: Page[];
let totalSourcePages = 0;
let totalSourceBlocks = 0;

beforeAll(async () => {
  const generated = await generateUserAndSpace();
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
    createdBy: user.id,
    cardCount: 2
  });

  cardPages = await prisma.page.findMany({
    where: {
      parentId: boardPage.id,
      type: 'card'
    }
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
    const { space: targetSpace } = await generateUserAndSpace();

    const data = await exportWorkspacePages({
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

    const boardBlock = prismaToBlock(blocks.find((b) => b.type === 'board')!) as Board;
    const viewBlocks = blocks.filter((b) => b.type === 'view');

    expect(boardBlock.fields.viewIds.sort()).toStrictEqual(viewBlocks.map((b) => b.id).sort());
    expect(pages.length).toBe(totalSourcePages);
    expect(blocks.length).toBe(totalSourceBlocks);
  });

  it('should return a hashmap of the source page ids and the page ids for their new versions', async () => {
    const { space: targetSpace } = await generateUserAndSpace();

    const data = await exportWorkspacePages({
      sourceSpaceIdOrDomain: space.domain
    });

    const importResult = await importWorkspacePages({
      targetSpaceIdOrDomain: targetSpace.domain,
      exportData: data
    });

    expect(importResult.oldNewRecordIdHashMap).toMatchObject({
      [root_1.id]: expect.any(String),
      [page_1_1.id]: expect.any(String),
      [page_1_1_1.id]: expect.any(String),
      [boardPage.id]: expect.any(String),
      [cardPages[0].id]: expect.any(String),
      [cardPages[1].id]: expect.any(String)
    });
  });

  it('should auto-generate a proposal category in the target space if it does not have a category with the same name as that of the source proposal', async () => {
    const { space: sourceSpace } = await testUtilsUser.generateUserAndSpace();

    const category1Name = 'Category 1 - Duplicated';

    const category2Name = 'Category 2 - Only exists in source space';

    const proposalCategory1SourceSpace = await testUtilsProposals.generateProposalCategory({
      spaceId: sourceSpace.id,
      title: category1Name
    });

    const proposal1 = await testUtilsProposals.generateProposal({
      spaceId: sourceSpace.id,
      userId: sourceSpace.createdBy,
      categoryId: proposalCategory1SourceSpace.id,
      title: 'Proposal 1 in source space'
    });

    const proposalCategory2SourceSpace = await testUtilsProposals.generateProposalCategory({
      spaceId: sourceSpace.id,
      title: category2Name
    });

    const proposal2 = await testUtilsProposals.generateProposal({
      spaceId: sourceSpace.id,
      userId: sourceSpace.createdBy,
      categoryId: proposalCategory2SourceSpace.id,
      title: 'Proposal 2 in source space'
    });

    const proposal3 = await testUtilsProposals.generateProposal({
      spaceId: sourceSpace.id,
      userId: sourceSpace.createdBy,
      categoryId: proposalCategory2SourceSpace.id,
      title: 'Proposal 3 in source space'
    });

    // Create a category with the same name in the target space
    const { space: targetSpace } = await generateUserAndSpace();

    const proposalCategory1TargetSpace = await testUtilsProposals.generateProposalCategory({
      spaceId: targetSpace.id,
      title: category1Name
    });

    const data = await exportWorkspacePages({
      sourceSpaceIdOrDomain: sourceSpace.domain
    });

    const importResult = await importWorkspacePages({
      targetSpaceIdOrDomain: targetSpace.domain,
      exportData: data
    });

    const targetSpaceProposals = await prisma.proposal.findMany({
      where: {
        spaceId: targetSpace.id
      },
      select: {
        spaceId: true,
        page: {
          select: {
            title: true
          }
        },
        category: {
          select: {
            id: true,
            title: true
          }
        }
      }
    });

    expect(targetSpaceProposals).toHaveLength(3);

    expect(targetSpaceProposals).toMatchObject(
      expect.arrayContaining<(typeof targetSpaceProposals)[number]>([
        {
          spaceId: targetSpace.id,
          page: {
            title: proposal1.page.title
          },
          category: {
            // There was already a category with the same name, it should have been auto-matched
            id: proposalCategory1TargetSpace.id,
            title: category1Name
          }
        },
        {
          spaceId: targetSpace.id,
          page: {
            title: proposal2.page.title
          },
          category: {
            // Missing category with same name, so we port it over
            id: expect.any(String),
            title: category2Name
          }
        },
        {
          spaceId: targetSpace.id,
          page: {
            title: proposal3.page.title
          },
          category: {
            // Missing category with same name, so we port it over
            id: expect.any(String),
            title: category2Name
          }
        }
      ])
    );
  });

  it('should accept a filename as the source data input', async () => {
    const { space: targetSpace } = await generateUserAndSpace();

    const exportName = `test-${v4()}.json`;

    const { data, path } = await exportWorkspacePagesToDisk({
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
    expect(pages.every((p) => p.autoGenerated)).toBe(true);
  });
});
