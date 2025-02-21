import type { RewardBlock, Prisma } from '@charmverse/core/prisma';
import type { OptionalNullable } from '@packages/lib/utils/types';

export function mockRewardBlocks({
  spaceId,
  createdBy
}: {
  spaceId: string;
  createdBy: string;
}): Prisma.RewardBlockCreateManyInput[] {
  return [
    {
      id: '__defaultBoard',
      createdAt: new Date(),
      updatedAt: new Date(),
      title: '',
      parentId: '',
      rootId: spaceId,
      spaceId,
      type: 'board',
      schema: 1,
      createdBy,
      updatedBy: createdBy,
      fields: {
        icon: '',
        viewIds: [],
        isTemplate: false,
        description: '',
        headerImage: null,
        cardProperties: [],
        showDescription: false,
        columnCalculations: []
      }
    },
    {
      id: '__defaultView',
      createdAt: new Date(),
      updatedAt: new Date(),
      title: '',
      parentId: '__defaultBoard',
      rootId: spaceId,
      spaceId,
      type: 'view',
      schema: 1,
      createdBy,
      updatedBy: createdBy,
      fields: {
        filter: { filters: [], operation: 'and' },
        viewType: 'table',
        cardOrder: [],
        openPageIn: 'center_peek',
        sortOptions: [{ reversed: false, propertyId: '__title' }],
        columnWidths: {
          __limit: 150,
          __title: 400,
          __available: 150,
          __reviewers: 150,
          __applicants: 200,
          __rewardChain: 150,
          __rewardAmount: 150,
          __rewardStatus: 150,
          __rewardCustomValue: 150
        },
        hiddenOptionIds: [],
        columnWrappedIds: ['__title'],
        visibleOptionIds: [],
        defaultTemplateId: '',
        columnCalculations: {},
        kanbanCalculations: {},
        visiblePropertyIds: [
          '__rewardStatus',
          '__rewardAmount',
          '__rewardChain',
          '__rewardCustomValue',
          '__applicants',
          '__reviewers',
          '__available',
          '__limit'
        ]
      }
    }
  ];
}
