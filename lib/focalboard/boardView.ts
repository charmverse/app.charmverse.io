import { upperFirst } from 'lodash';

import type { Block } from 'lib/focalboard/block';
import { createBlock } from 'lib/focalboard/block';
import type { FilterGroup } from 'lib/focalboard/filterGroup';
import { createFilterGroup } from 'lib/focalboard/filterGroup';

export type IViewType = 'board' | 'table' | 'gallery' | 'calendar';
export type ISortOption = { propertyId: '__title' | string; reversed: boolean };

export type ViewSourceType = 'board_page' | 'google_form';

export type KanbanCalculationFields = {
  calculation: string;
  propertyId: string;
};

export type BoardViewFields = {
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
  sourceType?: ViewSourceType;
  linkedSourceId?: string;
};

export type BoardView = Block & {
  fields: BoardViewFields;
};

function createBoardView(block?: Block): BoardView {
  const fields: BoardViewFields = {
    viewType: block?.fields.viewType || 'board',
    groupById: block?.fields.groupById,
    dateDisplayPropertyId: block?.fields.dateDisplayPropertyId,
    sortOptions: block?.fields.sortOptions?.map((o: ISortOption) => ({ ...o })) || [],
    visiblePropertyIds: block?.fields.visiblePropertyIds?.slice() || [],
    visibleOptionIds: block?.fields.visibleOptionIds?.slice() || [],
    hiddenOptionIds: block?.fields.hiddenOptionIds?.slice() || [],
    collapsedOptionIds: block?.fields.collapsedOptionIds?.slice() || [],
    filter: createFilterGroup(block?.fields.filter),
    cardOrder: block?.fields.cardOrder?.slice() || [],
    columnWidths: { ...(block?.fields.columnWidths || {}) },
    columnCalculations: { ...(block?.fields.columnCalculations || {}) },
    kanbanCalculations: { ...(block?.fields.kanbanCalculations || {}) },
    defaultTemplateId: block?.fields.defaultTemplateId || '',
    linkedSourceId: block?.fields.linkedSourceId,
    sourceType: block?.fields.sourceType
  };

  return {
    ...createBlock(block),
    type: 'view',
    fields
  };
}

export function formatViewTitle(view: BoardView) {
  return `${upperFirst(view.fields.viewType)} view`;
}

export { createBoardView };
