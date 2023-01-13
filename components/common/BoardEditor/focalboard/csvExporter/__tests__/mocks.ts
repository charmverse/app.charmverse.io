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
