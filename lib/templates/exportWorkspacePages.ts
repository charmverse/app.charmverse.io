import fs from 'node:fs/promises';
import path from 'node:path';

import type { Block } from '@prisma/client';
import { validate } from 'uuid';

import { prisma } from 'db';
import type { PageNodeWithChildren } from 'lib/pages';
import { resolvePageTree } from 'lib/pages/server/resolvePageTree';
import type { PageContent, TextContent } from 'lib/prosemirror/interfaces';
import { DataNotFoundError } from 'lib/utilities/errors';

import type { ExportedPage, WorkspaceExport } from './interfaces';

export interface ExportWorkspacePage {
  sourceSpaceIdOrDomain: string;
  exportName?: string;
  rootPageIds?: string[];
  skipBounties?: boolean;
  skipProposals?: boolean;
  skipBountyTemplates?: boolean;
  skipProposalTemplates?: boolean;
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

export async function exportWorkspacePages({
  sourceSpaceIdOrDomain,
  exportName,
  rootPageIds,
  skipBounties = false,
  skipProposals = false,
  skipBountyTemplates = false,
  skipProposalTemplates = false
}: ExportWorkspacePage): Promise<{ data: WorkspaceExport; path?: string }> {
  const isUuid = validate(sourceSpaceIdOrDomain);

  const space = await prisma.space.findUnique({
    where: isUuid ? { id: sourceSpaceIdOrDomain } : { domain: sourceSpaceIdOrDomain }
  });

  if (!space) {
    throw new DataNotFoundError(`Space not found: ${sourceSpaceIdOrDomain}`);
  }

  const rootPages = await prisma.page.findMany({
    where: {
      ...(rootPageIds ? { id: { in: rootPageIds } } : { spaceId: space.id, parentId: null }),
      deletedAt: null
    }
  });

  const exportData: WorkspaceExport = {
    pages: []
  };

  // Replace by multi resolve page tree in future
  const mappedTrees = await Promise.all(
    rootPages.map(async (page) => {
      return resolvePageTree({ pageId: page.id, flattenChildren: true, fullPage: true });
    })
  );

  // Console reporting for manual exports
  // const pageIndexes = mappedTrees.reduce((acc, val) => {
  //   let pageCount = Object.keys(acc).length;

  //   [val.targetPage, ...val.flatChildren].forEach((p) => {
  //     pageCount += 1;
  //     acc[p.id] = pageCount;
  //   });

  //   return acc;
  // }, {} as Record<string, number>);

  /**
   * Mutates the given node to provision its block data
   */
  async function recursiveResolveBlocks({ node }: { node: PageNodeWithChildren<ExportedPage> }): Promise<void> {
    // eslint-disable-next-line no-console
    // console.log('Processing page ', pageIndexes[node.id], ' / ', totalPages);

    if (node.type.match('board')) {
      const boardblocks = await prisma.block.findMany({
        where: {
          rootId: node.id as string,
          type: {
            in: ['board', 'view']
          }
        }
      });

      node.blocks = {
        board: boardblocks.find((block) => block.type === 'board') as Block,
        views: boardblocks.filter((block) => block.type === 'view') as Block[]
      };
    } else if (node.type.match('card')) {
      const cardBlock = await prisma.block.findFirst({
        where: {
          id: node.id as string,
          type: 'card'
        }
      });

      node.blocks = {
        card: cardBlock as Block
      };
    } else if (
      node.bountyId &&
      ((node.type === 'bounty' && !skipBounties) || (node.type === 'bounty_template' && !skipBountyTemplates))
    ) {
      node.bounty = await prisma.bounty.findUnique({
        where: {
          id: node.bountyId
        },
        include: {
          permissions: true
        }
      });
    } else if (
      node.proposalId &&
      ((node.type === 'proposal' && !skipProposals) || (node.type === 'proposal_template' && !skipProposalTemplates))
    ) {
      node.proposal = await prisma.proposal.findUnique({
        where: {
          id: node.proposalId
        },
        include: {
          category: true
        }
      });
    }

    // node.children = node.children?.filter((child) => !excludedPageTypes.includes(child.type)) ?? [];

    await Promise.all(
      (node.children ?? []).map(async (child) => {
        await recursiveResolveBlocks({ node: child });
      })
    );
    const pollIds: string[] = [];
    const inlineDatabasePageIds: string[] = [];
    recurse(node.content as PageContent, (_node) => {
      if (_node.type === 'poll') {
        const attrs = _node.attrs as { pollId: string };
        if (attrs.pollId) {
          pollIds.push(attrs.pollId);
        }
      } else if (_node.type === 'inlineDatabase') {
        const attrs = _node.attrs as { pageId: string };
        if (attrs.pageId) {
          inlineDatabasePageIds.push(attrs.pageId);
        }
      }
    });

    if (pollIds.length) {
      node.votes = await prisma.vote.findMany({
        where: {
          id: {
            in: pollIds
          }
        },
        include: {
          voteOptions: true
        }
      });
    }

    if (inlineDatabasePageIds.length) {
      const inlineDatabasesData = await exportWorkspacePages({
        sourceSpaceIdOrDomain,
        exportName,
        rootPageIds: inlineDatabasePageIds,
        skipBounties,
        skipProposals
      });
      // Only store the inline database in this field
      node.inlineDatabases = inlineDatabasesData.data.pages.filter((page) => inlineDatabasePageIds.includes(page.id));
      // Rest of the pages will be added to the top level pages array
      inlineDatabasesData.data.pages.forEach((page) => {
        if (!inlineDatabasePageIds.includes(page.id)) {
          exportData.pages.push(page);
        }
      });
    }
  }

  await Promise.all(
    mappedTrees.map(async (tree) => {
      await recursiveResolveBlocks({ node: tree.targetPage });
    })
  );

  mappedTrees.forEach((t) => {
    exportData.pages.push(t.targetPage);
  });

  if (!exportName) {
    return {
      data: exportData
    };
  }

  const exportFolder = path.join(__dirname, 'exports');

  try {
    await fs.readdir(exportFolder);
  } catch (err) {
    await fs.mkdir(exportFolder);
  }

  // Continue writing only if an export name was provided
  const exportFilePath = path.join(exportFolder, `${exportName}.json`);

  await fs.writeFile(exportFilePath, JSON.stringify(exportData, null, 2));

  return {
    data: exportData,
    path: exportFilePath
  };
}
