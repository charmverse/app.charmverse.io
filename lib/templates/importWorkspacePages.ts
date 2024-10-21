import { log } from '@charmverse/core/log';
import type { PageMeta } from '@charmverse/core/pages';
import type { Space } from '@charmverse/core/prisma';
import { Prisma } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import type { BoardViewFields } from '@root/lib/databases/boardView';
import { isBoardPageType } from '@root/lib/pages/isBoardPageType';
import { createPage } from '@root/lib/pages/server/createPage';
import { generatePagePathFromPathAndTitle, getPagePath } from '@root/lib/pages/utils';
import { updateEntityIds } from '@root/lib/prosemirror/updateEntityIds';
import type { Reward } from '@root/lib/rewards/interfaces';
import { getSpace } from '@root/lib/spaces/getSpace';
import { typedKeys } from '@root/lib/utils/objects';
import { v4 as uuid } from 'uuid';

import type { ExportedPage } from './exportWorkspacePages';
import { getImportData } from './getImportData';
import type { ImportParams } from './interfaces';

type WorkspaceImportOptions = {
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

type GenerateNewPagesInput = WorkspaceImportOptions & {
  targetSpace: Pick<Space, 'id' | 'createdBy' | 'defaultPagePermissionGroup'>;
  sourcePages: ExportedPage[];
};

type NewPagesOutput = {
  blockArgs: Prisma.BlockCreateManyInput[];
  bountyArgs: Prisma.BountyCreateManyInput[];
  pageArgs: Prisma.PageCreateInput[];
  voteArgs: Prisma.VoteCreateManyInput[];
  voteOptionsArgs: Prisma.VoteOptionsCreateManyInput[];
  bountyPermissionArgs: Prisma.BountyPermissionCreateManyInput[];
  proposalArgs: Prisma.ProposalCreateManyInput[];
  proposalReviewerArgs: Prisma.ProposalReviewerCreateManyInput[];
  proposalRubricCriteriaArgs: Prisma.ProposalRubricCriteriaCreateManyInput[];
  proposalEvaluationArgs: Prisma.ProposalEvaluationCreateManyInput[];
  proposalEvaluationPermissionArgs: Prisma.ProposalEvaluationPermissionCreateManyInput[];
  oldNewRecordIdHashMap: Record<string, string>;
};

type WorkspaceImportResult = {
  pages: PageMeta[];
  totalBlocks: number;
  totalPages: number;
  rootPageIds: string[];
  bounties: Reward[];
  blockIds: string[];
  oldNewRecordIdHashMap: Record<string, string>;
};

export function _generateNewPages({
  targetSpace,
  sourcePages,
  parentId: rootParentId,
  updateTitle,
  includePermissions,
  resetPaths,
  oldNewRoleIdHashMap,
  importingToDifferentSpace,
  oldNewProposalWorkflowIdHashMap = {}
}: GenerateNewPagesInput): NewPagesOutput {
  const pageArgs: Prisma.PageCreateInput[] = [];

  const sourcePagesMap = (sourcePages ?? []).reduce(
    (acc, page) => {
      acc[page.id] = page;
      if (page.bountyId) {
        acc[page.bountyId] = page;
      }
      return acc;
    },
    {} as Record<string, PageMeta>
  );

  const blockArgs: NewPagesOutput['blockArgs'] = [];
  const bountyArgs: NewPagesOutput['bountyArgs'] = [];
  const bountyPermissionArgs: NewPagesOutput['bountyPermissionArgs'] = [];
  const proposalArgs: NewPagesOutput['proposalArgs'] = [];
  const proposalReviewerArgs: NewPagesOutput['proposalReviewerArgs'] = [];
  const proposalEvaluationArgs: NewPagesOutput['proposalEvaluationArgs'] = [];
  const proposalRubricCriteriaArgs: NewPagesOutput['proposalRubricCriteriaArgs'] = [];
  const proposalEvaluationPermissionArgs: NewPagesOutput['proposalEvaluationPermissionArgs'] = [];
  const voteArgs: NewPagesOutput['voteArgs'] = [];
  const voteOptionsArgs: NewPagesOutput['voteOptionsArgs'] = [];

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
              spaceId: permission.spaceId && importingToDifferentSpace ? targetSpace.id : permission.spaceId,
              roleId:
                permission.roleId && importingToDifferentSpace
                  ? oldNewRoleIdHashMap?.[permission.roleId]
                  : permission.roleId,
              userId: permission.userId
                ? importingToDifferentSpace
                  ? targetSpace.createdBy
                  : permission.userId
                : undefined,
              inheritedFromPermission: newSourcePermissionId,
              id: newPagePermissionId
            };
          })
          .filter((permission) => permission.userId || permission.roleId || permission.spaceId || permission.public)
      : [
          {
            id: newPermissionId,
            permissionLevel: targetSpace.defaultPagePermissionGroup ?? 'full_access',
            spaceId: targetSpace.id,
            inheritedFromPermission: rootSpacePermissionId === newPermissionId ? undefined : rootSpacePermissionId
          }
        ];

    const newPageContent: Prisma.PageCreateInput = {
      ...pageWithoutJoins,
      createdAt: new Date(),
      updatedAt: new Date(),
      // increase index by 1 for root pages so that Getting started appears first
      index: !currentParentId ? pageWithoutJoins.index + 1 : pageWithoutJoins.index,
      title:
        parentId === rootParentId && updateTitle
          ? `${pageWithoutJoins.title || 'Untitled'} (Copy)`
          : pageWithoutJoins.title,
      id: newId,
      autoGenerated: true,
      boardId: isBoardPageType(node.type) ? newId : undefined,
      parent: currentParentId
        ? {
            connect: {
              id: currentParentId
            }
          }
        : undefined,
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
      space: {
        connect: {
          id: targetSpace.id
        }
      },
      permissions: {
        createMany: {
          data: pagePermissions
        }
      },
      updatedBy: targetSpace.createdBy,
      author: {
        connect: {
          id: targetSpace.createdBy
        }
      }
    };

    if (resetPaths) {
      const newPath = generatePagePathFromPathAndTitle({
        existingPagePath: newPageContent.path,
        title: newPageContent.title
      });

      newPageContent.path = newPath;
    }

    // Always reset additional paths
    newPageContent.additionalPaths = [];

    if (node.type.match('card')) {
      const cardBlock = node.blocks?.card;

      if (cardBlock) {
        cardBlock.id = newId;
        cardBlock.rootId = currentParentId as string;
        cardBlock.parentId = currentParentId as string;
        cardBlock.updatedAt = undefined as any;
        cardBlock.createdAt = undefined as any;
        cardBlock.updatedBy = targetSpace.createdBy;
        cardBlock.createdBy = targetSpace.createdBy;
        cardBlock.spaceId = targetSpace.id;

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
          } else if (block.type === 'view') {
            const fields = block.fields as BoardViewFields;
            if (fields.linkedSourceId) {
              const newBoardId = oldNewRecordIdHashMap[fields.linkedSourceId] || uuid(); // create a new id if we have not processed this board yet
              oldNewRecordIdHashMap[fields.linkedSourceId] = newBoardId;
              fields.linkedSourceId = newBoardId;
            }
          }

          block.rootId = newId;
          block.parentId = block.type === 'board' ? '' : newId;
          // eslint-disable @typescript-eslint/no-non-null-assertion
          block.updatedAt = undefined as any;
          block.createdAt = undefined as any;
          block.createdBy = targetSpace.createdBy;
          block.updatedBy = targetSpace.createdBy;
          block.spaceId = targetSpace.id;

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
        spaceId: targetSpace.id,
        createdBy: targetSpace.createdBy,
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
          permissionToCreate.spaceId = targetSpace.id;
        } else if (sourceBountyPermission.userId) {
          if (sourceBounty.spaceId !== targetSpace.id) {
            permissionToCreate.userId = targetSpace.createdBy;
          } else {
            permissionToCreate.userId = sourceBountyPermission.userId;
          }
        } else if (sourceBountyPermission.roleId) {
          if (sourceBounty.spaceId !== targetSpace.id && oldNewRoleIdHashMap?.[sourceBountyPermission.roleId]) {
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
        spaceId: targetSpace.id,
        createdBy: targetSpace.createdBy,
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
            notificationLabels: (evaluation.notificationLabels ?? null) as Prisma.InputJsonValue,
            actionLabels: (evaluation.actionLabels ?? null) as Prisma.InputJsonValue,
            decidedBy: importingToDifferentSpace ? undefined : evaluation.decidedBy,
            id: newEvaluationId,
            voteSettings: evaluation.voteSettings as any,
            proposalId: newProposalId
          };
        })
      );
      pageArgs.push(newPageContent);
    }

    const { extractedPolls } = updateEntityIds({
      oldNewRecordIdHashMap,
      pages: [node]
    });

    if (pageVotes) {
      extractedPolls.forEach((extractedPoll) => {
        const originalVote = pageVotes.find((_pageVote) => _pageVote.id === extractedPoll.originalId);

        if (originalVote && originalVote.pageId) {
          const { voteOptions, ...vote } = originalVote;
          voteArgs.push({
            ...vote,
            spaceId: targetSpace.id,
            createdBy: targetSpace.createdBy,
            pageId: oldNewRecordIdHashMap[originalVote.pageId],
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

  sourcePages.forEach((page) => {
    recursivePagePrep({ node: page, newParentId: null, oldNewPermissionMap: {} });
  });

  return {
    pageArgs,
    blockArgs,
    voteArgs,
    voteOptionsArgs,
    bountyArgs,
    bountyPermissionArgs,
    proposalArgs,
    proposalReviewerArgs,
    proposalRubricCriteriaArgs,
    proposalEvaluationPermissionArgs,
    proposalEvaluationArgs,
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
}: Omit<WorkspaceImportOptions, 'space'> & ImportParams): Promise<Omit<WorkspaceImportResult, 'bounties'>> {
  const _target = await getSpace(targetSpaceIdOrDomain);
  const { pages: sourcePages = [] } = await getImportData({ exportData, exportName });

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
  } = await _generateNewPages({
    targetSpace: _target,
    sourcePages,
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
    prisma.block.createMany({ data: blockArgs }),
    prisma.bounty.createMany({ data: bountyArgs }),
    prisma.bountyPermission.createMany({ data: bountyPermissionArgs }),
    prisma.proposal.createMany({ data: proposalArgs }),
    prisma.proposalEvaluation.createMany({ data: proposalEvaluationArgs }),
    prisma.proposalEvaluationPermission.createMany({ data: proposalEvaluationPermissionArgs }),
    prisma.proposalReviewer.createMany({ data: proposalReviewerArgs }),
    prisma.proposalRubricCriteria.createMany({ data: proposalRubricCriteriaArgs }),
    ...pageArgs.map((p) => {
      totalCreatedPages += 1;
      log.debug(`Creating page ${totalCreatedPages}/${pagesToCreate}: ${p.type} // ${p.title}`);
      return createPage<PageMeta>({ data: p });
    }),
    prisma.vote.createMany({ data: voteArgs }),
    prisma.voteOptions.createMany({ data: voteOptionsArgs })
  ]);

  const createdPages = createdData.filter((data) => 'id' in data) as PageMeta[];
  const createdPagesRecord: Record<string, PageMeta> = {};
  createdPages.forEach((createdPage) => {
    createdPagesRecord[createdPage.id] = createdPage;
  });

  const blockIds = blockArgs.map((blockArg) => blockArg.id);
  return {
    blockIds,
    totalPages: createdPages.length,
    pages: createdPages,
    totalBlocks: blockIds.length,
    rootPageIds: createdPages.filter((page) => page.parentId === parentId).map((p) => p.id),
    oldNewRecordIdHashMap
  };
}
