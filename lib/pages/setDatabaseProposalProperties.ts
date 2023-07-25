import { InvalidInputError } from '@charmverse/core/errors';
import type { Block } from '@charmverse/core/prisma-client';
import { ProposalStatus, prisma } from '@charmverse/core/prisma-client';
import { objectUtils } from '@charmverse/core/utilities';
import { v4 as uuid } from 'uuid';

import type { Constants } from 'components/common/BoardEditor/focalboard/src/constants';
import { getBoardColorFromColor } from 'components/common/BoardEditor/focalboard/src/constants';
import type { DatabaseProposalPropertyType, IPropertyTemplate } from 'lib/focalboard/board';

const properties: Record<DatabaseProposalPropertyType, () => IPropertyTemplate> = {
  proposalCategory: () => ({
    id: uuid(),
    name: 'Proposal Category',
    options: [],
    type: 'proposalCategory'
  }),
  proposalStatus: () => ({
    id: uuid(),
    name: 'Proposal Status',
    options: [],
    type: 'proposalStatus'
  }),
  proposalUrl: () => ({
    id: uuid(),
    name: 'Proposal Url',
    options: [],
    type: 'proposalUrl'
  })
};

/**
 * See components/proposals/components/ProposalStatusBadge.tsx // ProposalStatusColors for the corresponding statuses
 */

const proposalStatusBoardColors: Record<
  Exclude<ProposalStatus, 'draft'> | 'archived',
  keyof (typeof Constants)['menuColors']
> = {
  archived: 'propColorGray',
  discussion: 'propColorTeal',
  review: 'propColorYellow',
  reviewed: 'propColorPurple',
  vote_active: 'propColorPink',
  vote_closed: 'propColorRed'
};

export async function generateUpdatedProposalCategoryProperty({
  boardProperties,
  spaceId
}: {
  boardProperties: IPropertyTemplate[];
  spaceId: string;
}) {
  if (!spaceId) {
    throw new InvalidInputError(`Space ID required to generate proposal categories`);
  }

  const proposalCategories = await prisma.proposalCategory.findMany({
    where: {
      spaceId
    },
    select: {
      id: true,
      color: true,
      title: true
    }
  });

  // We will mutate and return this property
  const proposalCategoryProp = {
    ...(boardProperties.find((p) => p.type === 'proposalCategory') ?? {
      ...properties.proposalCategory(),
      id: uuid()
    })
  };

  proposalCategories.forEach((c) => {
    const existingPropertyValue = proposalCategoryProp.options.find((opt) => opt.id === c.id);

    if (!existingPropertyValue) {
      proposalCategoryProp.options.push({
        id: c.id,
        value: c.title,
        color: getBoardColorFromColor(c.color)
      });
    } else {
      existingPropertyValue.value = c.title;
    }
  });

  return proposalCategoryProp;
}

export async function generateUpdatedProposalStatusProperty({
  boardProperties
}: {
  boardProperties: IPropertyTemplate[];
}) {
  // We will mutate and return this property
  const proposalStatusProp = {
    ...(boardProperties.find((p) => p.type === 'proposalStatus') ?? {
      ...properties.proposalStatus(),
      id: uuid()
    })
  };

  if (proposalStatusProp) {
    [...objectUtils.typedKeys(ProposalStatus), 'archived'].forEach((status) => {
      if (status !== 'draft') {
        const existingOption = proposalStatusProp.options.find((opt) => opt.value === status);
        if (!existingOption) {
          proposalStatusProp.options.push({
            color: proposalStatusBoardColors[status as Exclude<ProposalStatus, 'draft'> | 'archived'],
            id: uuid(),
            value: status
          });
        }
      }
    });
    return proposalStatusProp;
  }

  return proposalStatusProp;
}
export async function generateUpdatedProposalUrlProperty({
  boardProperties
}: {
  boardProperties: IPropertyTemplate[];
}) {
  // We will mutate and return this property
  const proposalStatusProp = {
    ...(boardProperties.find((p) => p.type === 'proposalUrl') ?? {
      ...properties.proposalUrl(),
      id: uuid()
    })
  };

  return proposalStatusProp;
}

export async function setDatabaseProposalProperties({ databaseId }: { databaseId: string }): Promise<Block> {
  const database = await prisma.block.findUniqueOrThrow({
    where: {
      id: databaseId
    }
  });

  const boardProperties = ((database.fields as any).cardProperties as IPropertyTemplate[]) ?? [];

  const [categoryProp, statusProp, proposalUrlProp] = await Promise.all([
    generateUpdatedProposalCategoryProperty({ boardProperties, spaceId: database.spaceId }),
    generateUpdatedProposalStatusProperty({ boardProperties }),
    generateUpdatedProposalUrlProperty({ boardProperties })
  ]);

  const existingCategoryPropIndex = boardProperties.findIndex((p) => p.type === 'proposalCategory');

  if (existingCategoryPropIndex > -1) {
    boardProperties[existingCategoryPropIndex] = categoryProp;
  } else {
    boardProperties.push(categoryProp);
  }

  const existingStatusPropIndex = boardProperties.findIndex((p) => p.type === 'proposalStatus');

  if (existingStatusPropIndex > -1) {
    boardProperties[existingStatusPropIndex] = statusProp;
  } else {
    boardProperties.push(statusProp);
  }

  const existingUrlPropIndex = boardProperties.findIndex((p) => p.type === 'proposalUrl');

  if (existingUrlPropIndex > -1) {
    boardProperties[existingUrlPropIndex] = proposalUrlProp;
  } else {
    boardProperties.push(proposalUrlProp);
  }

  return prisma.block.update({
    where: {
      id: database.id
    },
    data: {
      fields: {
        ...(database.fields as any),
        cardProperties: boardProperties
      }
    }
  });
}

/**
 * Returns all proposal properties
 */
export function extractDatabaseProposalProperties({
  database
}: {
  database: Block;
}): Partial<Record<DatabaseProposalPropertyType, IPropertyTemplate>> {
  return {
    proposalCategory: (database.fields as any).cardProperties.find(
      (prop: IPropertyTemplate) => prop.type === 'proposalCategory'
    ),
    proposalUrl: (database.fields as any).cardProperties.find((prop: IPropertyTemplate) => prop.type === 'proposalUrl'),
    proposalStatus: (database.fields as any).cardProperties.find(
      (prop: IPropertyTemplate) => prop.type === 'proposalStatus'
    )
  };
}
