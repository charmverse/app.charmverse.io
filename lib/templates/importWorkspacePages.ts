import { log } from '@charmverse/core/log';
import type { PageMeta } from '@charmverse/core/pages';
import type { Page } from '@charmverse/core/prisma';
import { Prisma } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { v4 as uuid, validate } from 'uuid';

import { isBoardPageType } from 'lib/pages/isBoardPageType';
import { createPage } from 'lib/pages/server/createPage';
import { generatePagePathFromPathAndTitle, getPagePath } from 'lib/pages/utils';
import type { PageContent, TextContent, TextMark } from 'lib/prosemirror/interfaces';
import type { Reward } from 'lib/rewards/interfaces';
import { getSpace } from 'lib/spaces/getSpace';
import { typedKeys } from 'lib/utils/objects';

import type { ExportedPage } from './exportWorkspacePages';
import { getImportData } from './getImportData';
import type { ImportParams, OldNewIdHashMap } from './interfaces';

type WorkspaceImportOptions = ImportParams & {
  // Parent id of root pages, could be another page or null if space is parent
  parentId?: string | null;
  importingToDifferentSpace?: boolean;
  updateTitle?: boolean;
  includePermissions?: boolean;
  resetPaths?: boolean;
  oldNewRoleIdHashMap?: Record<string, string>;
  oldNewCustomProposalPropertyIdHashMap?: Record<string, string>;
  oldNewCustomRewardPropertyIdHashMap?: Record<string, string>;
  oldNewProposalWorkflowIdHashMap?: Record<string, string>;
};
type UpdateRefs = {
  oldNewRecordIdHashMap: Record<string, string>;
  pages: Page[];
};

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
function updateReferences({ oldNewRecordIdHashMap, pages }: UpdateRefs) {
  const extractedPolls: Map<string, { pageId: string; newPollId: string; originalId: string }> = new Map();

  for (const page of pages) {
    recurse(page.content as PageContent, (node) => {
      if (node.type === 'poll') {
        const attrs = node.attrs as { pollId: string };
        if (attrs.pollId) {
          const newPollId = uuid();
          extractedPolls.set(attrs.pollId, { newPollId, pageId: page.id, originalId: attrs.pollId });
          attrs.pollId = newPollId;
        }
      } else if (node.type === 'page' || node.type === 'linkedPage') {
        const attrs = node.attrs as { id: string };
        const oldPageId = attrs.id;
        let newPageId = oldPageId ? oldNewRecordIdHashMap[oldPageId] : undefined;

        if (oldPageId && !newPageId) {
          newPageId = uuid();
          oldNewRecordIdHashMap[oldPageId] = newPageId;
          oldNewRecordIdHashMap[newPageId] = oldPageId;
        }
        if (oldPageId && newPageId) {
          attrs.id = newPageId;
        }
      } else if (node.type === 'mention' && node.attrs?.type === 'page') {
        const attrs = node.attrs as { value: string };
        const oldPageId = attrs.value;
        let newPageId = oldPageId ? oldNewRecordIdHashMap[oldPageId] : undefined;

        if (oldPageId && !newPageId) {
          newPageId = uuid();
          oldNewRecordIdHashMap[oldPageId] = newPageId;
          oldNewRecordIdHashMap[newPageId] = oldPageId;
        }
        if (oldPageId && newPageId) {
          attrs.value = newPageId;
        }
      } else if (node.type === 'inlineDatabase') {
        const attrs = node.attrs as { pageId: string };
        const oldPageId = attrs.pageId;
        let newPageId = oldPageId ? oldNewRecordIdHashMap[oldPageId] : undefined;

        if (oldPageId && !newPageId) {
          newPageId = uuid();
          oldNewRecordIdHashMap[oldPageId] = newPageId;
          oldNewRecordIdHashMap[newPageId] = oldPageId;
        }

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
    extractedPolls
  };
}

type WorkspaceImportResult = {
  pages: PageMeta[];
  totalBlocks: number;
  totalPages: number;
  rootPageIds: string[];
  bounties: Reward[];
  blockIds: string[];
} & OldNewIdHashMap;

async function generateImportWorkspacePages({
  targetSpaceIdOrDomain,
  exportData,
  exportName,
  parentId: rootParentId,
  updateTitle,
  includePermissions,
  resetPaths,
  oldNewRoleIdHashMap,
  importingToDifferentSpace,
  oldNewProposalWorkflowIdHashMap = {}
}: WorkspaceImportOptions): Promise<
  {
    pageArgs: Prisma.PageCreateArgs[];
    blockArgs: Prisma.BlockCreateManyArgs;
    voteArgs: Prisma.VoteCreateManyArgs;
    voteOptionsArgs: Prisma.VoteOptionsCreateManyArgs;
    bountyArgs: Prisma.BountyCreateManyArgs;
    bountyPermissionArgs: Prisma.BountyPermissionCreateManyArgs;
    proposalArgs: Prisma.ProposalCreateManyArgs;
    proposalReviewerArgs: Prisma.ProposalReviewerCreateManyArgs;
    proposalRubricCriteriaArgs: Prisma.ProposalRubricCriteriaCreateManyArgs;
    proposalEvaluationArgs: Prisma.ProposalEvaluationCreateManyArgs;
    proposalEvaluationPermissionArgs: Prisma.ProposalEvaluationPermissionCreateManyArgs;
  } & OldNewIdHashMap
> {
  const isUuid = validate(targetSpaceIdOrDomain);

  const space = await prisma.space.findUniqueOrThrow({
    where: isUuid ? { id: targetSpaceIdOrDomain } : { domain: targetSpaceIdOrDomain }
  });

  const { pages } = await getImportData({ exportData, exportName });

  const pageArgs: Prisma.PageCreateArgs[] = [];

  const sourcePagesMap = (pages ?? []).reduce((acc, page) => {
    acc[page.id] = page;
    if (page.bountyId) {
      acc[page.bountyId] = page;
    }
    return acc;
  }, {} as Record<string, PageMeta>);

  const voteArgs: Prisma.VoteCreateManyInput[] = [];
  const voteOptionsArgs: Prisma.VoteOptionsCreateManyInput[] = [];
  const blockArgs: Prisma.BlockCreateManyInput[] = [];
  const bountyArgs: Prisma.BountyCreateManyInput[] = [];
  const bountyPermissionArgs: Prisma.BountyPermissionCreateManyInput[] = [];
  const proposalArgs: Prisma.ProposalCreateManyInput[] = [];
  const proposalReviewerArgs: Prisma.ProposalReviewerCreateManyInput[] = [];
  const proposalEvaluationArgs: Prisma.ProposalEvaluationCreateManyInput[] = [];
  const proposalRubricCriteriaArgs: Prisma.ProposalRubricCriteriaCreateManyInput[] = [];
  const proposalEvaluationPermissionArgs: Prisma.ProposalEvaluationPermissionCreateManyInput[] = [];

  // 2 way hashmap to find link between new and old page ids
  const oldNewRecordIdHashMap: Record<string, string> = {};
  // keep track of what has been processed
  const processedNodes: Record<string, boolean> = {};
  /**
   * Mutates the pages, updating their ids
   */
  function recursivePagePrep({
    node,
    newParentId,
    rootSpacePermissionId,
    rootPageId,
    oldNewPermissionMap
  }: {
    // This is required for inline databases
    rootPageId?: string;
    node: ExportedPage;
    newParentId: string | null;
    rootSpacePermissionId?: string;
    oldNewPermissionMap: Record<string, string>;
  }) {
    // Don't process duplicate nodes in the export
    if (processedNodes[node.id]) {
      return;
    }
    processedNodes[node.id] = true;

    const existingNewPageId =
      node.type === 'page' || isBoardPageType(node.type) ? oldNewRecordIdHashMap[node.id] : undefined;

    const newId = rootPageId ?? existingNewPageId ?? uuid();

    oldNewRecordIdHashMap[newId] = node.id;
    oldNewRecordIdHashMap[node.id] = newId;
    const {
      children,
      createdBy,
      updatedBy,
      spaceId,
      cardId,
      proposalId,
      version,
      parentId,
      bountyId,
      blocks,
      votes: pageVotes,
      inlineDatabases: ignored,
      ...pageWithoutJoins
      // This typecasting is for retro-compatibility. We dropped inline databases from exports, but old versions may still contain this content
    } = node as ExportedPage & { inlineDatabases: any };

    typedKeys(pageWithoutJoins).forEach((key) => {
      if (pageWithoutJoins[key] === null) {
        delete pageWithoutJoins[key];
      }
    });

    const currentParentId = newParentId ?? rootParentId ?? undefined;

    const newPermissionId = uuid();

    // Reassigned when creating the root permission
    rootSpacePermissionId = rootSpacePermissionId ?? newPermissionId;

    const pagePermissions = includePermissions
      ? node.permissions
          .map(({ sourcePermission, pageId, inheritedFromPermission, ...permission }) => {
            const newPagePermissionId = uuid();

            oldNewPermissionMap[permission.id] = newPagePermissionId;

            const newSourcePermissionId = inheritedFromPermission
              ? oldNewPermissionMap[inheritedFromPermission]
              : undefined;

            return {
              ...permission,
              permissionLevel: permission.permissionLevel ?? 'full_access',
              spaceId: permission.spaceId && importingToDifferentSpace ? space.id : permission.spaceId,
              roleId:
                permission.roleId && importingToDifferentSpace
                  ? oldNewRoleIdHashMap?.[permission.roleId]
                  : permission.roleId,
              userId: permission.userId ? (importingToDifferentSpace ? space.createdBy : permission.userId) : undefined,
              inheritedFromPermission: newSourcePermissionId,
              id: newPagePermissionId
            };
          })
          .filter((permission) => permission.userId || permission.roleId || permission.spaceId || permission.public)
      : [
          {
            id: newPermissionId,
            permissionLevel: space?.defaultPagePermissionGroup ?? 'full_access',
            spaceId: space.id,
            inheritedFromPermission: rootSpacePermissionId === newPermissionId ? undefined : rootSpacePermissionId
          }
        ];

    const newPageContent: Prisma.PageCreateArgs = {
      data: {
        ...pageWithoutJoins,
        // increase index by 1 for root pages so that Getting started appears first
        index: !currentParentId ? pageWithoutJoins.index + 1 : pageWithoutJoins.index,
        title:
          parentId === rootParentId && updateTitle
            ? `${pageWithoutJoins.title || 'Untitled'} (Copy)`
            : pageWithoutJoins.title,
        id: newId,
        autoGenerated: true,
        boardId: isBoardPageType(node.type) ? newId : undefined,
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
            data: pagePermissions
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

    if (resetPaths) {
      const newPath = generatePagePathFromPathAndTitle({
        existingPagePath: newPageContent.data.path,
        title: newPageContent.data.title as string
      });

      newPageContent.data.path = newPath;
    }

    // Always reset additional paths
    newPageContent.data.additionalPaths = [];

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
          recursivePagePrep({ node: child, newParentId: newId, rootSpacePermissionId, oldNewPermissionMap });
        });
      }
    } else if (isBoardPageType(node.type)) {
      const boardBlock = node.blocks?.board;
      const viewBlocks = (node.blocks?.views ?? []).map((view) => ({ ...view, id: uuid() }));
      if (boardBlock && boardBlock.fields) {
        (boardBlock.fields as any).viewIds = viewBlocks.map((viewBlock) => viewBlock.id);
      }

      // We don't want to create empty databases, but we do want to allow inline databases to be empty so they can be initialised
      if (boardBlock && ((!node.type.match('inline') && viewBlocks.length > 0) || node.type.match('inline'))) {
        [boardBlock, ...viewBlocks].forEach((block) => {
          if (block.type === 'board') {
            block.id = newId;
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
          recursivePagePrep({ node: child, newParentId: newId, rootSpacePermissionId, oldNewPermissionMap });
        });
      }
    } else if (node.type === 'page') {
      pageArgs.push(newPageContent);
      node.children?.forEach((child) => {
        recursivePagePrep({ node: child, newParentId: newId, rootSpacePermissionId, oldNewPermissionMap });
      });
    } else if ((node.type === 'bounty' || node.type === 'bounty_template') && node.bounty) {
      pageArgs.push(newPageContent);
      const {
        createdAt,
        updatedAt,
        createdBy: bountyCreatedBy,
        permissions: bountyPermissions,
        ...bounty
      } = node.bounty;
      bountyArgs.push({
        ...bounty,
        fields: (bounty.fields as any) || undefined,
        spaceId: space.id,
        createdBy: space.createdBy,
        id: oldNewRecordIdHashMap[node.id]
      });
      bountyPermissions.forEach(({ id, ...sourceBountyPermission }) => {
        const sourceBounty = sourcePagesMap[sourceBountyPermission.bountyId];

        const permissionToCreate: Prisma.BountyPermissionCreateManyInput = {
          id: uuid(),
          userId: undefined,
          spaceId: undefined,
          roleId: undefined,
          bountyId: newId,
          permissionLevel: sourceBountyPermission.permissionLevel
        };

        if (sourceBountyPermission.spaceId) {
          permissionToCreate.spaceId = space.id;
        } else if (sourceBountyPermission.userId) {
          if (sourceBounty.spaceId !== space.id) {
            permissionToCreate.userId = space.createdBy;
          } else {
            permissionToCreate.userId = sourceBountyPermission.userId;
          }
        } else if (sourceBountyPermission.roleId) {
          if (sourceBounty.spaceId !== space.id && oldNewRoleIdHashMap?.[sourceBountyPermission.roleId]) {
            permissionToCreate.roleId = oldNewRoleIdHashMap?.[sourceBountyPermission.roleId];
          } else {
            permissionToCreate.roleId = sourceBountyPermission.roleId;
          }
        }

        if (permissionToCreate.userId || permissionToCreate.roleId || permissionToCreate.spaceId) {
          bountyPermissionArgs.push(permissionToCreate);
        }
      });
    } else if ((node.type === 'proposal' || node.type === 'proposal_template') && node.proposal) {
      // TODO: Handle cross space reviewers and authors
      const { evaluations, fields, ...proposal } = node.proposal;
      const newProposalId = oldNewRecordIdHashMap[node.id];
      proposalArgs.push({
        ...proposal,
        reviewedBy: undefined,
        spaceId: space.id,
        createdBy: space.createdBy,
        status: 'published',
        id: newProposalId,
        workflowId: importingToDifferentSpace
          ? oldNewProposalWorkflowIdHashMap[proposal.workflowId!]
          : proposal.workflowId,
        fields: fields || {}
      });
      proposalEvaluationArgs.push(
        ...evaluations.map(({ id, rubricCriteria, reviewers, permissions: evaluationPermissions, ...evaluation }) => {
          const newEvaluationId = uuid();

          for (const reviewer of reviewers) {
            if (importingToDifferentSpace && !reviewer.userId) {
              proposalReviewerArgs.push({
                ...reviewer,
                id: uuid(),
                roleId: reviewer.roleId ? oldNewRoleIdHashMap?.[reviewer.roleId] : undefined,
                systemRole: reviewer.systemRole,
                proposalId: newProposalId,
                evaluationId: newEvaluationId
              });
            } else if (!importingToDifferentSpace) {
              proposalReviewerArgs.push({
                ...reviewer,
                id: uuid(),
                proposalId: newProposalId,
                evaluationId: newEvaluationId
              });
            }
          }

          evaluationPermissions?.forEach((perm) => {
            if (importingToDifferentSpace && !perm.userId) {
              proposalEvaluationPermissionArgs.push({
                evaluationId: newEvaluationId,
                operation: perm.operation,
                id: uuid(),
                roleId: perm.roleId ? oldNewRoleIdHashMap?.[perm.roleId] : undefined,
                systemRole: perm.systemRole
              });
            } else if (!importingToDifferentSpace) {
              proposalEvaluationPermissionArgs.push({
                evaluationId: newEvaluationId,
                operation: perm.operation,
                id: uuid(),
                userId: perm.userId,
                roleId: perm.roleId,
                systemRole: perm.systemRole
              });
            }
          });

          proposalRubricCriteriaArgs.push(
            ...rubricCriteria.map(({ id: _id, ...criteria }) => ({
              ...criteria,
              id: uuid(),
              proposalId: newProposalId,
              evaluationId: newEvaluationId,
              parameters: criteria.parameters as any
            }))
          );
          return {
            ...evaluation,
            decidedBy: importingToDifferentSpace ? undefined : evaluation.decidedBy,
            id: newEvaluationId,
            voteSettings: evaluation.voteSettings as any,
            proposalId: newProposalId
          };
        })
      );
      pageArgs.push(newPageContent);
    }

    const { extractedPolls } = updateReferences({
      oldNewRecordIdHashMap,
      pages: [node]
    });

    if (pageVotes) {
      extractedPolls.forEach((extractedPoll) => {
        const pageVote = pageVotes.find((_pageVote) => _pageVote.id === extractedPoll.originalId);

        if (pageVote && pageVote.pageId) {
          const { voteOptions, ...vote } = pageVote;
          voteArgs.push({
            ...vote,
            spaceId: space.id,
            createdBy: space.createdBy,
            pageId: oldNewRecordIdHashMap[pageVote.pageId],
            id: extractedPoll.newPollId as string,
            content: vote.content ?? Prisma.DbNull,
            contentText: vote.contentText
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
  }

  pages?.forEach((page) => {
    recursivePagePrep({ node: page, newParentId: null, oldNewPermissionMap: {} });
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
    proposalReviewerArgs: {
      data: proposalReviewerArgs
    },
    proposalRubricCriteriaArgs: {
      data: proposalRubricCriteriaArgs
    },
    proposalEvaluationPermissionArgs: {
      data: proposalEvaluationPermissionArgs
    },
    proposalEvaluationArgs: {
      data: proposalEvaluationArgs
    },

    oldNewRecordIdHashMap
  };
}

export async function importWorkspacePages({
  targetSpaceIdOrDomain,
  exportData,
  exportName,
  parentId,
  updateTitle,
  includePermissions,
  resetPaths,
  oldNewRoleIdHashMap,
  importingToDifferentSpace,
  oldNewProposalWorkflowIdHashMap
}: WorkspaceImportOptions): Promise<Omit<WorkspaceImportResult, 'bounties'>> {
  const _target = await getSpace(targetSpaceIdOrDomain);

  const {
    pageArgs,
    blockArgs,
    bountyArgs,
    voteArgs,
    voteOptionsArgs,
    proposalArgs,
    proposalEvaluationArgs,
    proposalReviewerArgs,
    proposalRubricCriteriaArgs,
    proposalEvaluationPermissionArgs,
    bountyPermissionArgs,
    oldNewRecordIdHashMap
  } = await generateImportWorkspacePages({
    targetSpaceIdOrDomain: _target.id,
    exportData,
    exportName,
    parentId,
    updateTitle,
    includePermissions,
    resetPaths,
    oldNewRoleIdHashMap,
    importingToDifferentSpace,
    oldNewProposalWorkflowIdHashMap
  });

  const pagesToCreate = pageArgs.length;

  let totalCreatedPages = 0;

  const createdData = await prisma.$transaction([
    // The blocks needs to be created first before the page can connect with them
    prisma.block.createMany(blockArgs),
    prisma.bounty.createMany(bountyArgs),
    prisma.bountyPermission.createMany(bountyPermissionArgs),
    prisma.proposal.createMany(proposalArgs),
    prisma.proposalEvaluation.createMany(proposalEvaluationArgs),
    prisma.proposalEvaluationPermission.createMany(proposalEvaluationPermissionArgs),
    prisma.proposalReviewer.createMany(proposalReviewerArgs),
    prisma.proposalRubricCriteria.createMany(proposalRubricCriteriaArgs),
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
    rootPageIds: createdPages.filter((page) => page.parentId === parentId).map((p) => p.id),
    oldNewRecordIdHashMap
  };
}
