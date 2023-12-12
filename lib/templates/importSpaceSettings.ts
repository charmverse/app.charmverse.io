import { DataNotFoundError } from '@charmverse/core/errors';
import type {
  MemberProperty,
  MemberPropertyPermission,
  MemberPropertyPermissionLevel,
  Prisma,
  ProposalBlock,
  RewardBlock,
  Space
} from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { arrayUtils, stringUtils } from '@charmverse/core/utilities';
import { v4 as uuid } from 'uuid';

import type { Board, BoardFields } from 'lib/focalboard/board';
import type { BoardViewFields } from 'lib/focalboard/boardView';
import { getSpace } from 'lib/spaces/getSpace';

import { getImportData } from './getImportData';
import { importRoles } from './importRoles';
import type { ImportParams } from './interfaces';

type SpaceImportResult = Space & {
  memberProperties: (MemberProperty & { permissions: MemberPropertyPermission[] })[];
  proposalBlocks: ProposalBlock[];
  rewardBlocks: RewardBlock[];
};

export async function importSpaceSettings({
  targetSpaceIdOrDomain,
  ...importParams
}: ImportParams): Promise<SpaceImportResult> {
  const { space } = await getImportData(importParams);
  if (!space) {
    throw new DataNotFoundError(`No space to import`);
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

  const { oldNewRecordIdHashMap } = await importRoles({ targetSpaceIdOrDomain, ...importParams });

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
          roleId: perm.roleId ? oldNewRecordIdHashMap[perm.roleId] : undefined
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
    })
  ]);

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

  return prisma.space.findUniqueOrThrow({
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
      rewardBlocks: true
    }
  });
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
