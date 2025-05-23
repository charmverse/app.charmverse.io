import { upperFirst } from 'lodash-es';

import type { UIBlockWithDetails } from './block';
import { createBlock } from './block';
import type { DataSourceType, GoogleFormSourceData } from './board';
import type { FilterGroup } from './filterGroup';
import { createFilterGroup } from './filterGroup';

export type IViewType = 'board' | 'table' | 'gallery' | 'calendar';
export type ISortOption = { propertyId: '__title' | string; reversed: boolean };

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
  filter: FilterGroup;
  cardOrder: string[];
  columnWidths: Record<string, number>;
  columnCalculations: Record<string, string>;
  kanbanCalculations: Record<string, KanbanCalculationFields>;
  defaultTemplateId: string;
  // The sourceType & sourceData fields will be deleted once we complete the migration of these fields to the board block level
  sourceType?: DataSourceType;
  sourceData?: GoogleFormSourceData;
  // This field is only used for linked views
  linkedSourceId?: string;
  columnWrappedIds?: string[];
  openPageIn?: 'full_page' | 'center_peek';
};

export type BoardView = UIBlockWithDetails & {
  fields: BoardViewFields;
};

function createBoardView(block?: Pick<UIBlockWithDetails, 'fields'>): BoardView {
  const fields: BoardViewFields = {
    viewType: block?.fields.viewType || 'board',
    groupById: block?.fields.groupById,
    dateDisplayPropertyId: block?.fields.dateDisplayPropertyId,
    sortOptions: block?.fields.sortOptions?.map((o: ISortOption) => ({ ...o })) || [],
    visiblePropertyIds: block?.fields.visiblePropertyIds?.slice() || [],
    visibleOptionIds: block?.fields.visibleOptionIds?.slice() || [],
    hiddenOptionIds: block?.fields.hiddenOptionIds?.slice() || [],
    filter: createFilterGroup(block?.fields.filter),
    cardOrder: block?.fields.cardOrder?.slice() || [],
    columnWidths: { ...(block?.fields.columnWidths || {}) },
    columnCalculations: { ...(block?.fields.columnCalculations || {}) },
    kanbanCalculations: { ...(block?.fields.kanbanCalculations || {}) },
    defaultTemplateId: block?.fields.defaultTemplateId || '',
    linkedSourceId: block?.fields.linkedSourceId,
    sourceData: block?.fields.sourceData,
    sourceType: block?.fields.sourceType,
    columnWrappedIds: block?.fields.columnWrappedIds?.slice() || [],
    openPageIn: block?.fields.openPageIn || 'center_peek'
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
