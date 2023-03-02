import fs from 'node:fs/promises';
import path from 'node:path';

import type { Page, Prisma } from '@prisma/client';
import { v4, validate } from 'uuid';

import { prisma } from 'db';
import type { BountyWithDetails } from 'lib/bounties';
import log from 'lib/log';
import type { PageMeta } from 'lib/pages';
import { includePagePermissions } from 'lib/pages/server';
import { createPage } from 'lib/pages/server/createPage';
import { getPagePath } from 'lib/pages/utils';
import type { PageContent, TextContent, TextMark } from 'lib/prosemirror/interfaces';
import { DataNotFoundError, InvalidInputError } from 'lib/utilities/errors';
import { typedKeys } from 'lib/utilities/objects';

import { exportWorkspacePages } from './exportWorkspacePages';
import type { ExportedPage, WorkspaceExport, WorkspaceImport } from './interfaces';

interface UpdateRefs {
  oldNewHashMap: Record<string, string>;
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
function updateReferences({ oldNewHashMap, pages }: UpdateRefs) {
  const extractedPolls: Map<string, { pageId: string; newPollId: string }> = new Map();
  const inlineDatabases: Map<string, { pageId: string; inlineDatabaseId: string }> = new Map();

  for (const page of pages) {
    recurse(page.content as PageContent, (node) => {
      if (node.type === 'poll') {
        const attrs = node.attrs as { pollId: string };
        if (attrs.pollId) {
          const newPollId = v4();
          extractedPolls.set(attrs.pollId, { newPollId, pageId: page.id });
          attrs.pollId = newPollId;
        }
      } else if (node.type === 'page') {
        const attrs = node.attrs as { id: string };
        const oldPageId = attrs.id;
        const newPageId = oldPageId ? oldNewHashMap[oldPageId] : undefined;
        if (oldPageId && newPageId) {
          attrs.id = newPageId;
        }
      } else if (node.type === 'inlineDatabase') {
        const attrs = node.attrs as { pageId: string };
        const oldPageId = attrs.pageId;
        const newPageId = oldPageId ? oldNewHashMap[oldPageId] : undefined;
        if (oldPageId && newPageId) {
          attrs.pageId = newPageId;
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
    inlineDatabases
  };
}

interface WorkspaceImportResult {
  pages: PageMeta[];
  totalBlocks: number;
  totalPages: number;
  rootPageIds: string[];
  bounties: BountyWithDetails[];
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
  proposalAuthorsArgs: Prisma.ProposalAuthorCreateManyArgs;
  proposalReviewersArgs: Prisma.ProposalReviewerCreateManyArgs;
}> {
  const isUuid = validate(targetSpaceIdOrDomain);

  const space = await prisma.space.findUnique({
    where: isUuid ? { id: targetSpaceIdOrDomain } : { domain: targetSpaceIdOrDomain }
  });

  if (!space) {
    throw new DataNotFoundError(`Space not found: ${targetSpaceIdOrDomain}`);
  }

  const resolvedPath = path.resolve(path.join('lib', 'templates', 'exports', `${exportName}.json`));
  const dataToImport: WorkspaceExport = exportData ?? JSON.parse(await fs.readFile(resolvedPath, 'utf-8'));

  if (!dataToImport) {
    throw new InvalidInputError('Please provide the source export data, or export path');
  }

  // List of page object references which we will mutate
  const flatPages: Page[] = [];

  const pageArgs: Prisma.PageCreateArgs[] = [];

  const blockArgs: Prisma.BlockCreateManyInput[] = [];
  const bountyArgs: Prisma.BountyCreateManyInput[] = [];
  const bountyPermissionArgs: Prisma.BountyPermissionCreateManyInput[] = [];
  const proposalArgs: Prisma.ProposalCreateManyInput[] = [];
  const proposalAuthorsArgs: Prisma.ProposalAuthorCreateManyInput[] = [];
  const proposalReviewersArgs: Prisma.ProposalReviewerCreateManyInput[] = [];

  // 2 way hashmap to find link between new and old page ids
  const oldNewHashmap: Record<string, string> = {};

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

    oldNewHashmap[newId] = node.id;
    oldNewHashmap[node.id] = newId;

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
      votes,
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
            node.type === 'proposal'
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
            node.type === 'bounty'
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
            // eslint-disable @typescript-eslint/no-non-null-assertion
            id: space!.id
          }
        },
        permissions: {
          createMany: {
            data: [
              {
                id: newPermissionId,
                permissionLevel: space?.defaultPagePermissionGroup ?? 'full_access',
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                spaceId: space!.id,
                inheritedFromPermission: rootSpacePermissionId === newPermissionId ? undefined : rootSpacePermissionId
              }
            ]
          }
        },
        updatedBy: space!.createdBy,
        author: {
          connect: {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            id: space!.createdBy
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
        // eslint-disable @typescript-eslint/no-non-null-assertion
        cardBlock.updatedAt = undefined as any;
        cardBlock.createdAt = undefined as any;
        cardBlock.updatedBy = space!.createdBy;
        cardBlock.createdBy = space!.createdBy;
        cardBlock.spaceId = space!.id;

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
          block.createdBy = space!.createdBy;
          block.updatedBy = space!.updatedBy;
          block.spaceId = space!.id;
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
    } else if (node.type === 'bounty' && node.bounty) {
      pageArgs.push(newPageContent);
      const { createdAt, updatedAt, createdBy: bountyCreatedBy, permissions, ...bounty } = node.bounty;
      bountyArgs.push({
        ...bounty,
        createdBy: space!.createdBy,
        id: oldNewHashmap[node.id]
      });
      permissions.forEach(({ id, ...bountyPermission }) => {
        bountyPermissionArgs.push({
          ...bountyPermission,
          bountyId: oldNewHashmap[node.id]
        });
      });
    } else if (node.type === 'proposal' && node.proposal) {
      const { createdBy: proposalCreatedBy, authors, reviewers, ...proposal } = node.proposal;
      proposalArgs.push({
        ...proposal,
        createdBy: space!.createdBy,
        id: oldNewHashmap[node.id]
      });
      authors.forEach((author) => proposalAuthorsArgs.push({ ...author, proposalId: oldNewHashmap[node.id] }));
      reviewers.forEach((reviewer) => proposalReviewersArgs.push({ ...reviewer, proposalId: oldNewHashmap[node.id] }));
      pageArgs.push(newPageContent);
    }
  }

  dataToImport.pages.forEach((page) => {
    recursivePagePrep({ node: page, newParentId: null });
  });

  const { extractedPolls, inlineDatabases } = updateReferences({
    oldNewHashMap: oldNewHashmap,
    pages: flatPages
  });

  for (const inlineDatabase of inlineDatabases.entries()) {
    const [oldInlineDatabaseId, { inlineDatabaseId: newInlineDatabaseId, pageId: parentPageId }] = inlineDatabase;
    const inlineBoardPage = await prisma.page.findUnique({
      where: {
        id: oldInlineDatabaseId
      }
    });
    if (inlineBoardPage) {
      const { data } = await exportWorkspacePages({
        sourceSpaceIdOrDomain: space.id,
        rootPageIds: [oldInlineDatabaseId]
      });

      data.pages.forEach((page) => {
        recursivePagePrep({
          node: page,
          newParentId: page.id === oldInlineDatabaseId ? parentPageId : null,
          rootPageId: page.id === oldInlineDatabaseId ? newInlineDatabaseId : undefined
        });
      });
    }
  }

  const polls = await prisma.vote.findMany({
    where: {
      id: {
        in: Array.from(extractedPolls.keys())
      }
    },
    include: {
      voteOptions: true
    }
  });

  return {
    pageArgs,
    blockArgs: {
      data: blockArgs
    },
    voteArgs: {
      data: polls.map(({ voteOptions, ...poll }) => ({
        ...poll,
        createdBy: space.createdBy,
        pageId: oldNewHashmap[poll.pageId],
        id: extractedPolls.get(poll.id)?.newPollId as string
      }))
    },
    voteOptionsArgs: {
      data: polls
        .map((poll) =>
          poll.voteOptions.map((voteOption) => ({
            name: voteOption.name,
            voteId: extractedPolls.get(voteOption.voteId)?.newPollId as string
          }))
        )
        .flat()
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
    proposalAuthorsArgs: {
      data: proposalAuthorsArgs
    },
    proposalReviewersArgs: {
      data: proposalReviewersArgs
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
    proposalAuthorsArgs,
    proposalReviewersArgs,
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
  const createdBlocks = 0;

  const createdData = await prisma.$transaction([
    // The blocks needs to be created first before the page can connect with them
    prisma.block.createMany(blockArgs),
    prisma.bounty.createMany(bountyArgs),
    prisma.bountyPermission.createMany(bountyPermissionArgs),
    prisma.proposal.createMany(proposalArgs),
    prisma.proposalAuthor.createMany(proposalAuthorsArgs),
    prisma.proposalReviewer.createMany(proposalReviewersArgs),
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

  return {
    totalPages: createdPages.length,
    pages: createdPages,
    totalBlocks: createdBlocks,
    rootPageIds: createdPages.filter((page) => page.parentId === parentId).map((p) => p.id)
  };
}
