import type { BoardViewFields } from 'lib/focalboard/boardView';

export const generateFields = (
  visiblePropertyIds: string[] = [],
  visibleOptionIds: string[] = [],
  cardOrder: string[] = []
): BoardViewFields => {
  return {
    viewType: 'board',
    sortOptions: [],
    visiblePropertyIds,
    visibleOptionIds,
    hiddenOptionIds: [],
    collapsedOptionIds: [],
    filter: {
      operation: 'and',
      filters: []
    },
    cardOrder,
    columnWidths: {},
    columnCalculations: {},
    kanbanCalculations: {},
    defaultTemplateId: ''
  };
};

export const mockIntl = {
  formatMessage: ({ defaultMessage }: { id?: string; defaultMessage?: string; description?: string }) => defaultMessage
};

export const mockBoardBlock = {
  id: '559fb24f-119a-438d-a8cc-a2d5d97c46eb',
  deletedAt: null,
  createdAt: new Date(),
  createdBy: 'c6071d71-f6fe-4022-8aec-94df33d7f320',
  updatedAt: new Date(),
  updatedBy: 'c6071d71-f6fe-4022-8aec-94df33d7f320',
  spaceId: '5d81e3b6-7ad1-4087-87ff-50f92bdf78f0',
  rootId: '963da06b-6cd3-4770-8fd0-ebf266ffa999',
  schema: 0,
  type: 'board',
  title: 'Board',
  fields: {
    cardProperties: []
  },
  parentId: ''
};

export const mockCardBlock = {
  id: '563ra02b-6ce3-4880-8fu0-ebf266fda156',
  createdBy: 'c6071d71-f6fe-4022-8aec-94df33d7f320',
  spaceId: '5d81e3b6-7ad1-4087-87ff-50f92bdf78f0',
  rootId: '963da06b-6cd3-4770-8fd0-ebf266ffa999',
  parentId: '963da06b-6cd3-4770-8fd0-ebf266ffa999',
  type: 'card',
  title: 'Card 1',
  fields: {
    properties: {}
  }
};
