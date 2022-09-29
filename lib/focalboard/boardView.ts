
import type { Block } from './block';
import { createBlock } from './block';
import type { FilterGroup } from './filterGroup';
import { createFilterGroup } from './filterGroup';

type IViewType = 'board' | 'table' | 'gallery' | 'calendar'
type ISortOption = { propertyId: '__title' | string, reversed: boolean }

type KanbanCalculationFields = {
    calculation: string;
    propertyId: string;
}

type BoardViewFields = {
    viewType: IViewType;
    groupById?: string;
    dateDisplayPropertyId?: string;
    sortOptions: ISortOption[];
    visiblePropertyIds: string[];
    visibleOptionIds: string[];
    hiddenOptionIds: string[];
    collapsedOptionIds: string[];
    filter: FilterGroup;
    cardOrder: string[];
    columnWidths: Record<string, number>;
    columnCalculations: Record<string, string>;
    kanbanCalculations: Record<string, KanbanCalculationFields>;
    defaultTemplateId: string;
}

type BoardView = Block & {
    fields: BoardViewFields;
}

function createBoardView (block?: Partial<Block>): BoardView {
  return {
    ...createBlock(block),
    type: 'view',
    fields: {
      viewType: block?.fields?.viewType || 'board',
      groupById: block?.fields?.groupById,
      dateDisplayPropertyId: block?.fields?.dateDisplayPropertyId,
      sortOptions: block?.fields?.sortOptions?.map((o: ISortOption) => ({ ...o })) || [],
      visiblePropertyIds: block?.fields?.visiblePropertyIds?.slice() || [],
      visibleOptionIds: block?.fields?.visibleOptionIds?.slice() || [],
      hiddenOptionIds: block?.fields?.hiddenOptionIds?.slice() || [],
      collapsedOptionIds: block?.fields?.collapsedOptionIds?.slice() || [],
      filter: createFilterGroup(block?.fields?.filter),
      cardOrder: block?.fields?.cardOrder?.slice() || [],
      columnWidths: { ...(block?.fields?.columnWidths || {}) },
      columnCalculations: { ...(block?.fields?.columnCalculations) || {} },
      kanbanCalculations: { ...(block?.fields?.kanbanCalculations) || {} },
      defaultTemplateId: block?.fields?.defaultTemplateId || ''
    }
  };
}

export { createBoardView };
export type { BoardView, IViewType, ISortOption, KanbanCalculationFields };
