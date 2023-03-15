import fs from 'node:fs/promises';
import path from 'node:path';

import type { Page, Prisma } from '@prisma/client';
import { v4, validate } from 'uuid';

import { prisma } from 'db';
import type { BountyWithDetails } from 'lib/bounties';
import log from 'lib/log';
import type { PageMeta } from 'lib/pages';
import { createPage } from 'lib/pages/server/createPage';
import { getPagePath } from 'lib/pages/utils';
import type { PageContent, TextContent, TextMark } from 'lib/prosemirror/interfaces';
import { InvalidInputError } from 'lib/utilities/errors';
import { typedKeys } from 'lib/utilities/objects';

import type { ExportedPage, WorkspaceExport, WorkspaceImport } from './interfaces';

interface UpdateRefs {
  oldNewPageIdHashMap: Record<string, string>;
  pages: Page[];
}

function recurse(node: PageContent, cb: (node: PageContent | TextContent) => void) {
  if (node?.content) {
    node?.content.forEach((childNode) => {
      recurse(childNode, cb);
    });
  }
  if (node) {
    cb(node);
  }
}

/**
 * Mutates the provided content to replace nested page refs
 */
function updateReferences({ oldNewPageIdHashMap, pages }: UpdateRefs) {
  const extractedPolls: Map<string, { pageId: string; newPollId: string; originalId: string }> = new Map();
  const extractedInlineDatabases: Map<string, { pageId: string; inlineDatabaseId: string }> = new Map();

  for (const page of pages) {
    recurse(page.content as PageContent, (node) => {
      if (node.type === 'poll') {
        const attrs = node.attrs as { pollId: string };
        if (attrs.pollId) {
          const newPollId = v4();
          extractedPolls.set(attrs.pollId, { newPollId, pageId: page.id, originalId: attrs.pollId });
          attrs.pollId = newPollId;
        }
      } else if (node.type === 'page') {
        const attrs = node.attrs as { id: string };
        const oldPageId = attrs.id;
        const newPageId = oldPageId ? oldNewPageIdHashMap[oldPageId] : undefined;
        if (oldPageId && newPageId) {
          attrs.id = newPageId;
        }
      } else if (node.type === 'inlineDatabase') {
        const attrs = node.attrs as { pageId: string };
        if (attrs.pageId) {
          const newInlineDatabaseId = v4();
          extractedInlineDatabases.set(attrs.pageId, { pageId: page.id, inlineDatabaseId: newInlineDatabaseId });
          attrs.pageId = newInlineDatabaseId;
        }
      }

      const marks: TextMark[] = node.marks;

      if (marks) {
        node.marks = marks.filter((mark) => mark.type !== 'inline-comment');
      }
    });
  }

  return {
    extractedPolls,
    extractedInlineDatabases
  };
}

interface WorkspaceImportResult {
  pages: PageMeta[];
  totalBlocks: number;
  totalPages: number;
  rootPageIds: string[];
  bounties: BountyWithDetails[];
  blockIds: string[];
}

export async function generateImportWorkspacePages({
  targetSpaceIdOrDomain,
  exportData,
  exportName,
  parentId: rootParentId,
  updateTitle
}: WorkspaceImport): Promise<{
  pageArgs: Prisma.PageCreateArgs[];
  blockArgs: Prisma.BlockCreateManyArgs;
  voteArgs: Prisma.VoteCreateManyArgs;
  voteOptionsArgs: Prisma.VoteOptionsCreateManyArgs;
  bountyArgs: Prisma.BountyCreateManyArgs;
  bountyPermissionArgs: Prisma.BountyPermissionCreateManyArgs;
  proposalArgs: Prisma.ProposalCreateManyArgs;
  proposalCategoryArgs: Prisma.ProposalCategoryCreateManyArgs;
  proposalCategoryPermissionArgs: Prisma.ProposalCategoryPermissionCreateManyArgs;
}> {
  const isUuid = validate(targetSpaceIdOrDomain);

  const space = await prisma.space.findUniqueOrThrow({
    where: isUuid ? { id: targetSpaceIdOrDomain } : { domain: targetSpaceIdOrDomain },
    include: {
      proposalCategories: true
    }
  });
  const resolvedPath = path.resolve(path.join('lib', 'templates', 'exports', `${exportName}.json`));
  const dataToImport: WorkspaceExport = exportData ?? JSON.parse(await fs.readFile(resolvedPath, 'utf-8'));

  if (!dataToImport) {
    throw new InvalidInputError('Please provide the source export data, or export path');
  }

  // List of page object references which we will mutate
  const flatPages: Page[] = [];

  const pageArgs: Prisma.PageCreateArgs[] = [];

  const voteArgs: Prisma.VoteCreateManyInput[] = [];
  const voteOptionsArgs: Prisma.VoteOptionsCreateManyInput[] = [];
  const blockArgs: Prisma.BlockCreateManyInput[] = [];
  const bountyArgs: Prisma.BountyCreateManyInput[] = [];
  const bountyPermissionArgs: Prisma.BountyPermissionCreateManyInput[] = [];
  const proposalArgs: Prisma.ProposalCreateManyInput[] = [];
  const proposalCategoryArgs: Prisma.ProposalCategoryCreateManyInput[] = [];
  const proposalCategoryPermissionArgs: Prisma.ProposalCategoryPermissionCreateManyInput[] = [];

  // 2 way hashmap to find link between new and old page ids
  const oldNewPageIdHashMap: Record<string, string> = {};

  /**
   * Mutates the pages, updating their ids
   */
  function recursivePagePrep({
    node,
    newParentId,
    rootSpacePermissionId,
    rootPageId
  }: {
    // This is required for inline databases
    rootPageId?: string;
    node: ExportedPage;
    newParentId: string | null;
    rootSpacePermissionId?: string;
  }) {
    const newId = rootPageId ?? v4();

    oldNewPageIdHashMap[newId] = node.id;
    oldNewPageIdHashMap[node.id] = newId;

    flatPages.push(node);

    const {
      children,
      createdBy,
      updatedBy,
      spaceId,
      cardId,
      proposalId,
      parentId,
      bountyId,
      blocks,
      votes: pageVotes,
      inlineDatabases: pageInlineDatabases,
      ...pageWithoutJoins
    } = node;

    typedKeys(pageWithoutJoins).forEach((key) => {
      if (pageWithoutJoins[key] === null) {
        delete pageWithoutJoins[key];
      }
    });

    const currentParentId = newParentId ?? rootParentId ?? undefined;

    const newPermissionId = v4();

    // Reassigned when creating the root permission
    rootSpacePermissionId = rootSpacePermissionId ?? newPermissionId;

    const newPageContent: Prisma.PageCreateArgs = {
      data: {
        ...pageWithoutJoins,
        title:
          parentId === rootParentId && updateTitle
            ? `${pageWithoutJoins.title || 'Untitled'} (Copy)`
            : pageWithoutJoins.title,
        id: newId,
        autoGenerated: true,
        boardId: node.type.match('board') ? newId : undefined,
        parentId: currentParentId,
        proposal: {
          connect:
            node.type === 'proposal' || node.type === 'proposal_template'
              ? {
                  id: newId
                }
              : undefined
        },
        card: {
          connect:
            node.type === 'card'
              ? {
                  id: newId
                }
              : undefined
        },
        bounty: {
          connect:
            node.type === 'bounty' || node.type === 'bounty_template'
              ? {
                  id: newId
                }
              : undefined
        },
        content: (node.content as Prisma.InputJsonValue) ?? undefined,
        path: getPagePath(),
        convertedProposalId: undefined,
        space: {
          connect: {
            id: space.id
          }
        },
        permissions: {
          createMany: {
            data: [
              {
                id: newPermissionId,
                permissionLevel: space?.defaultPagePermissionGroup ?? 'full_access',
                spaceId: space.id,
                inheritedFromPermission: rootSpacePermissionId === newPermissionId ? undefined : rootSpacePermissionId
              }
            ]
          }
        },
        updatedBy: space.createdBy,
        author: {
          connect: {
            id: space.createdBy
          }
        }
      }
    };

    if (node.type.match('card')) {
      const cardBlock = node.blocks?.card;

      if (cardBlock) {
        cardBlock.id = newId;
        cardBlock.rootId = currentParentId as string;
        cardBlock.parentId = currentParentId as string;
        cardBlock.updatedAt = undefined as any;
        cardBlock.createdAt = undefined as any;
        cardBlock.updatedBy = space.createdBy;
        cardBlock.createdBy = space.createdBy;
        cardBlock.spaceId = space.id;

        pageArgs.push(newPageContent);
        blockArgs.push(cardBlock as Prisma.BlockCreateManyInput);

        node.children?.forEach((child) => {
          recursivePagePrep({ node: child, newParentId: newId, rootSpacePermissionId });
        });
      }
    } else if (node.type.match('board')) {
      const boardBlock = node.blocks?.board;
      const viewBlocks = node.blocks?.views;

      if (boardBlock && !!viewBlocks?.length) {
        [boardBlock, ...viewBlocks].forEach((block) => {
          if (block.type === 'board') {
            block.id = newId;
          } else {
            block.id = v4();
          }

          block.rootId = newId;
          block.parentId = block.type === 'board' ? '' : newId;
          // eslint-disable @typescript-eslint/no-non-null-assertion
          block.updatedAt = undefined as any;
          block.createdAt = undefined as any;
          block.createdBy = space.createdBy;
          block.updatedBy = space.updatedBy;
          block.spaceId = space.id;
          blockArgs.push(block as Prisma.BlockCreateManyInput);
        });
        pageArgs.push(newPageContent);

        node.children?.forEach((child) => {
          recursivePagePrep({ node: child, newParentId: newId, rootSpacePermissionId });
        });
      }
    } else if (node.type === 'page') {
      pageArgs.push(newPageContent);
      node.children?.forEach((child) => {
        recursivePagePrep({ node: child, newParentId: newId, rootSpacePermissionId });
      });
    } else if ((node.type === 'bounty' || node.type === 'bounty_template') && node.bounty) {
      pageArgs.push(newPageContent);
      const { createdAt, updatedAt, createdBy: bountyCreatedBy, permissions, ...bounty } = node.bounty;
      bountyArgs.push({
        ...bounty,
        spaceId: space.id,
        createdBy: space.createdBy,
        id: oldNewPageIdHashMap[node.id]
      });
      permissions.forEach(({ id, ...bountyPermission }) => {
        bountyPermissionArgs.push({
          ...bountyPermission,
          spaceId: space.id,
          bountyId: oldNewPageIdHashMap[node.id]
        });
      });
    } else if ((node.type === 'proposal' || node.type === 'proposal_template') && node.proposal) {
      // TODO: Handle cross space reviewers and authors
      const { category, ...proposal } = node.proposal;
      let categoryId: string | undefined;
      if (category) {
        categoryId =
          space.proposalCategories.find((cat) => cat.title === category.title)?.id ||
          proposalCategoryArgs.find((proposalCategoryArg) => proposalCategoryArg.title === category.title)?.id;
        if (!categoryId) {
          categoryId = v4();
          proposalCategoryArgs.push({
            id: categoryId,
            title: category.title,
            color: category.color,
            spaceId: space.id
          });
          proposalCategoryPermissionArgs.push({
            permissionLevel: 'full_access',
            proposalCategoryId: categoryId,
            spaceId: space.id
          });
        }
      }
      proposalArgs.push({
        ...proposal,
        categoryId,
        reviewedBy: undefined,
        spaceId: space.id,
        createdBy: space.createdBy,
        status: 'draft',
        id: oldNewPageIdHashMap[node.id]
      });
      pageArgs.push(newPageContent);
    }

    const { extractedPolls, extractedInlineDatabases } = updateReferences({
      oldNewPageIdHashMap,
      pages: [node]
    });

    if (pageVotes) {
      extractedPolls.forEach((extractedPoll) => {
        const pageVote = pageVotes.find((_pageVote) => _pageVote.id === extractedPoll.originalId);

        if (pageVote) {
          const { voteOptions, ...vote } = pageVote;
          voteArgs.push({
            ...vote,
            createdBy: space.createdBy,
            pageId: oldNewPageIdHashMap[pageVote.pageId],
            id: extractedPoll.newPollId as string
          });

          voteOptions.forEach((voteOption) => {
            voteOptionsArgs.push({
              name: voteOption.name,
              voteId: extractedPoll.newPollId as string
            });
          });
        }
      });
    }

    if (pageInlineDatabases) {
      pageInlineDatabases.forEach((pageInlineDatabase) => {
        const extractedInlineDatabase = extractedInlineDatabases.get(pageInlineDatabase.id);
        if (extractedInlineDatabase) {
          recursivePagePrep({
            node: pageInlineDatabase,
            newParentId: newId,
            rootPageId: extractedInlineDatabase.inlineDatabaseId
          });
        }
      });
    }
  }

  dataToImport.pages.forEach((page) => {
    recursivePagePrep({ node: page, newParentId: null });
  });

  return {
    pageArgs,
    blockArgs: {
      data: blockArgs
    },
    voteArgs: {
      data: voteArgs
    },
    voteOptionsArgs: {
      data: voteOptionsArgs
    },
    bountyArgs: {
      data: bountyArgs
    },
    bountyPermissionArgs: {
      data: bountyPermissionArgs
    },
    proposalArgs: {
      data: proposalArgs
    },
    proposalCategoryArgs: {
      data: proposalCategoryArgs
    },
    proposalCategoryPermissionArgs: {
      data: proposalCategoryPermissionArgs
    }
  };
}

export async function importWorkspacePages({
  targetSpaceIdOrDomain,
  exportData,
  exportName,
  parentId,
  updateTitle
}: WorkspaceImport): Promise<Omit<WorkspaceImportResult, 'bounties'>> {
  const {
    pageArgs,
    blockArgs,
    bountyArgs,
    voteArgs,
    voteOptionsArgs,
    proposalArgs,
    proposalCategoryArgs,
    proposalCategoryPermissionArgs,
    bountyPermissionArgs
  } = await generateImportWorkspacePages({
    targetSpaceIdOrDomain,
    exportData,
    exportName,
    parentId,
    updateTitle
  });

  const pagesToCreate = pageArgs.length;

  let totalCreatedPages = 0;

  const createdData = await prisma.$transaction([
    // The blocks needs to be created first before the page can connect with them
    prisma.block.createMany(blockArgs),
    prisma.bounty.createMany(bountyArgs),
    prisma.bountyPermission.createMany(bountyPermissionArgs),
    prisma.proposalCategory.createMany(proposalCategoryArgs),
    prisma.proposalCategoryPermission.createMany(proposalCategoryPermissionArgs),
    prisma.proposal.createMany(proposalArgs),
    ...pageArgs.map((p) => {
      totalCreatedPages += 1;
      log.debug(`Creating page ${totalCreatedPages}/${pagesToCreate}: ${p.data.type} // ${p.data.title}`);
      return createPage<PageMeta>(p);
    }),
    prisma.vote.createMany(voteArgs),
    prisma.voteOptions.createMany(voteOptionsArgs)
  ]);

  const createdPages = createdData.filter((data) => 'id' in data) as PageMeta[];
  const createdPagesRecord: Record<string, PageMeta> = {};
  createdPages.forEach((createdPage) => {
    createdPagesRecord[createdPage.id] = createdPage;
  });

  const blockIds = Array.isArray(blockArgs.data) ? blockArgs.data.map((blockArg) => blockArg.id) : [blockArgs.data.id];
  return {
    blockIds,
    totalPages: createdPages.length,
    pages: createdPages,
    totalBlocks: blockIds.length,
    rootPageIds: createdPages.filter((page) => page.parentId === parentId).map((p) => p.id)
  };
}
