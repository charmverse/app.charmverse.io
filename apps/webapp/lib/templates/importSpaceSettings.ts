import { DataNotFoundError } from '@charmverse/core/errors';
import type {
  MemberProperty,
  MemberPropertyPermission,
  MemberPropertyPermissionLevel,
  Prisma,
  ProposalBlock,
  ProposalWorkflow,
  RewardBlock,
  Space
} from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import type { ProposalWorkflowTyped, WorkflowEvaluationJson } from '@charmverse/core/proposals';
import { arrayUtils, stringUtils } from '@charmverse/core/utilities';
import type { BoardFields } from '@packages/databases/board';
import type { BoardViewFields } from '@packages/databases/boardView';
import { v4 as uuid } from 'uuid';

import { getSpace } from 'lib/spaces/getSpace';

import { getImportData } from './getImportData';
import type { ImportParams } from './interfaces';

type SpaceImportResult = Space & {
  memberProperties: (MemberProperty & { permissions: MemberPropertyPermission[] })[];
  proposalBlocks: ProposalBlock[];
  proposalWorkflows: ProposalWorkflow[];
  oldNewProposalWorkflowIds: Record<string, string>;
  rewardBlocks: RewardBlock[];
};

export async function importSpaceSettings({
  targetSpaceIdOrDomain,
  oldNewRoleIdHashMap,
  ...importParams
}: ImportParams & { oldNewRoleIdHashMap: Record<string, string> }): Promise<SpaceImportResult> {
  const { space } = await getImportData(importParams);
  if (!space) {
    throw new DataNotFoundError(`No space to import: ${importParams.exportName}`);
  }

  const targetSpace = await getSpace(targetSpaceIdOrDomain);

  const {
    features,
    memberProfiles,
    memberProperties,
    proposalBlocks,
    rewardBlocks,
    notificationToggles,
    defaultPagePermissionGroup,
    hiddenFeatures,
    requireProposalTemplate,
    publicBountyBoard,
    publicProposals,
    defaultPublicPages
  } = space;

  const propertiesToCreate: (Prisma.MemberPropertyCreateManyInput & { permissions: MemberPropertyPermission[] })[] =
    memberProperties.map((prop) => {
      return {
        ...prop,
        options: prop.options as Prisma.InputJsonValue[],
        id: uuid(),
        spaceId: targetSpace.id,
        createdBy: targetSpace.createdBy,
        updatedBy: targetSpace.createdBy,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    });

  const permissionsToCreate: Prisma.MemberPropertyPermissionCreateManyInput[] = propertiesToCreate.flatMap((prop) => {
    return prop.permissions
      .map((perm) => {
        return {
          memberPropertyId: prop.id,
          memberPropertyPermissionLevel: perm.memberPropertyPermissionLevel as MemberPropertyPermissionLevel,
          roleId: perm.roleId ? oldNewRoleIdHashMap[perm.roleId] : undefined
        } as Prisma.MemberPropertyPermissionCreateManyInput;
      })
      .filter((perm) => !!perm.roleId);
  });

  const [existingProposalBlocks, existingRewardBlocks] = await Promise.all([
    prisma.proposalBlock.findMany({
      where: {
        spaceId: targetSpace.id
      }
    }),
    prisma.rewardBlock.findMany({
      where: {
        spaceId: targetSpace.id
      }
    }),
    prisma.proposalWorkflow.findMany({
      where: {
        spaceId: targetSpace.id
      }
    })
  ]);

  const oldNewProposalWorkflowIds: Record<string, string> = {};

  const workflowsToCreate = space.proposalWorkflows
    // Dedupe by title
    .map((workflow) => {
      const newId = uuid();
      oldNewProposalWorkflowIds[workflow.id] = newId;
      return {
        ...workflow,
        spaceId: targetSpace.id,
        createdAt: new Date(),
        id: newId,
        evaluations: workflow.evaluations.map((_eval) => {
          const typedEval = _eval as WorkflowEvaluationJson;
          const permissions = typedEval.permissions
            .map((perm) => {
              return {
                operation: perm.operation,
                roleId: perm.roleId ? oldNewRoleIdHashMap[perm.roleId] : undefined,
                systemRole: perm.systemRole,
                // Ignore user ids
                userId: undefined
              };
            })
            .filter((perm) => !!perm.roleId || perm.systemRole);
          return {
            ...typedEval,
            id: uuid(),
            permissions,
            title: typedEval.title,
            type: typedEval.type
          };
        })
      };
    });

  await prisma.$transaction([
    prisma.space.update({
      where: {
        id: targetSpace.id
      },
      data: {
        features: features as Prisma.InputJsonValue[],
        memberProfiles: memberProfiles as Prisma.InputJsonValue[],
        notificationToggles: notificationToggles as Prisma.InputJsonValue,
        // new
        defaultPagePermissionGroup,
        hiddenFeatures,
        requireProposalTemplate,
        publicBountyBoard,
        publicProposals,
        defaultPublicPages
      }
    }),
    prisma.memberProperty.createMany({
      data: propertiesToCreate.map(({ permissions, ...prop }) => prop)
    }),
    prisma.memberPropertyPermission.createMany({
      data: permissionsToCreate
    }),
    prisma.proposalWorkflow.createMany({
      data: workflowsToCreate as Prisma.ProposalWorkflowCreateManyInput[]
    }),
    ...rewardBlocks.map((b) => {
      const matchingBlock = existingRewardBlocks.find((existingBlock) => existingBlock.id === b.id);

      const fields =
        b.type === 'board'
          ? ({
              ...(matchingBlock?.fields as any),
              ...(b.fields as any),
              cardProperties: mergeArrayWithoutDuplicates(
                [
                  ...((b.fields as any as BoardFields)?.cardProperties ?? []),
                  ...((matchingBlock?.fields as any as BoardFields)?.cardProperties ?? [])
                ],
                'id'
              ),
              viewIds: arrayUtils.uniqueValues([
                ...((b.fields as any as BoardFields).viewIds ?? []),
                ...((matchingBlock?.fields as any as BoardFields)?.viewIds ?? [])
              ])
            } as BoardFields)
          : b.type === 'view'
            ? ({
                ...(matchingBlock?.fields as any),
                ...(b.fields as any),
                sortOptions: mergeArrayWithoutDuplicates(
                  [
                    ...((matchingBlock?.fields as any as BoardViewFields)?.sortOptions ?? []),
                    ...((b.fields as any as BoardViewFields)?.sortOptions ?? [])
                  ],
                  'propertyId'
                ),
                columnWidths: {
                  ...(matchingBlock?.fields as any as BoardViewFields)?.columnWidths,
                  ...(b?.fields as any as BoardViewFields)?.columnWidths
                },
                visiblePropertyIds: arrayUtils.uniqueValues([
                  ...((b.fields as any as BoardViewFields).visiblePropertyIds ?? []),
                  ...((matchingBlock?.fields as any as BoardViewFields)?.visiblePropertyIds ?? [])
                ])
              } as BoardViewFields)
            : {};

      return prisma.rewardBlock.upsert({
        where: { id_spaceId: { id: b.id, spaceId: targetSpace.id } },
        create: {
          ...(b as any),
          id: stringUtils.isUUID(b.id) ? uuid() : b.id,
          createdAt: new Date(),
          updatedAt: new Date(),
          rootId: targetSpace.id,
          spaceId: targetSpace.id,
          createdBy: targetSpace.createdBy,
          updatedBy: targetSpace.createdBy,
          fields
        },
        update: { fields, updatedAt: new Date() }
      });
    }),
    ...proposalBlocks.map((b) => {
      const matchingBlock = existingProposalBlocks.find((existingBlock) => existingBlock.id === b.id);

      const fields =
        b.type === 'board'
          ? ({
              ...(matchingBlock?.fields as any),
              ...(b.fields as any),
              cardProperties: mergeArrayWithoutDuplicates(
                [
                  ...((b.fields as any as BoardFields)?.cardProperties ?? []),
                  ...((matchingBlock?.fields as any as BoardFields)?.cardProperties ?? [])
                ],
                'id'
              ),
              viewIds: arrayUtils.uniqueValues([
                ...((b.fields as any as BoardFields).viewIds ?? []),
                ...((matchingBlock?.fields as any as BoardFields)?.viewIds ?? [])
              ])
            } as BoardFields)
          : b.type === 'view'
            ? ({
                ...(matchingBlock?.fields as any),
                ...(b.fields as any),
                sortOptions: mergeArrayWithoutDuplicates(
                  [
                    ...((matchingBlock?.fields as any as BoardViewFields)?.sortOptions ?? []),
                    ...((b.fields as any as BoardViewFields)?.sortOptions ?? [])
                  ],
                  'propertyId'
                ),
                columnWidths: {
                  ...(matchingBlock?.fields as any as BoardViewFields)?.columnWidths,
                  ...(b?.fields as any as BoardViewFields)?.columnWidths
                },
                visiblePropertyIds: arrayUtils.uniqueValues([
                  ...((b.fields as any as BoardViewFields).visiblePropertyIds ?? []),
                  ...((matchingBlock?.fields as any as BoardViewFields)?.visiblePropertyIds ?? [])
                ])
              } as BoardViewFields)
            : {};

      return prisma.proposalBlock.upsert({
        where: { id_spaceId: { id: b.id, spaceId: targetSpace.id } },
        create: {
          ...(b as any),
          id: stringUtils.isUUID(b.id) ? uuid() : b.id,
          createdAt: new Date(),
          updatedAt: new Date(),
          rootId: targetSpace.id,
          spaceId: targetSpace.id,
          createdBy: targetSpace.createdBy,
          updatedBy: targetSpace.createdBy,
          fields
        },
        update: { fields, updatedAt: new Date() }
      });
    })
  ]);

  return prisma.space
    .findUniqueOrThrow({
      where: {
        id: targetSpace.id
      },
      include: {
        memberProperties: {
          include: {
            permissions: true
          }
        },
        proposalBlocks: true,
        proposalWorkflows: true,
        rewardBlocks: true
      }
    })
    .then((s) => ({ ...s, oldNewProposalWorkflowIds }));
}

function mergeArrayWithoutDuplicates<T>(arr: T[], key: keyof T): T[] {
  const result: T[] = [];

  arr.forEach((item) => {
    const existingItem = result.find((r) => r[key] === item[key]);
    if (!existingItem) {
      result.push({ ...item });
    }
  });

  return result;
}
