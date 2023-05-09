import arrayEquals from 'lodash/isEqual';
import { v4 } from 'uuid';

import type { PropertyType } from './board';

export const BooleanDataTypeConditions = ['is', 'is_not'] as const;

export const TextDataTypeConditions = [
  'is',
  'is_not',
  'contains',
  'does_not_contain',
  'starts_with',
  'ends_with',
  'is_empty',
  'is_not_empty'
] as const;

export const NumberDataTypeConditions = [
  'equal',
  'not_equal',
  'greater_than',
  'less_than',
  'greater_than_equal',
  'less_than_equal',
  'is_empty',
  'is_not_empty'
] as const;

export const DateDataTypeConditions = [
  'is',
  'is_not',
  'is_before',
  'is_after',
  'is_on_or_before',
  'is_on_or_after',
  'is_empty',
  'is_not_empty'
] as const;

export const MultiSelectDataTypeConditions = ['contains', 'does_not_contain', 'is_empty', 'is_not_empty'] as const;

export const SelectDataTypeConditions = ['is', 'is_not', 'is_empty', 'is_not_empty'] as const;

export const MiscDataTypeConditions = ['is_empty', 'is_not_empty'] as const;

export type DataType = 'text' | 'number' | 'boolean' | 'date' | 'multi_select' | 'select' | 'misc';

export type DataTypeFactory<DT extends DataType, DataTypeDataTypeConditions extends readonly string[]> = {
  datatype: DT;
  conditions: readonly DataTypeDataTypeConditions[number][];
};

export type BooleanDataTypeConfig = DataTypeFactory<'boolean', typeof BooleanDataTypeConditions>;
export type TextDataTypeConfig = DataTypeFactory<'text', typeof TextDataTypeConditions>;
export type NumberDataTypeConfig = DataTypeFactory<'number', typeof NumberDataTypeConditions>;
export type DateDataTypeConfig = DataTypeFactory<'date', typeof DateDataTypeConditions>;
export type MultiSelectDataTypeConfig = DataTypeFactory<'multi_select', typeof MultiSelectDataTypeConditions>;
export type SelectDataTypeConfig = DataTypeFactory<'select', typeof SelectDataTypeConditions>;
export type MiscDataTypeConfig = DataTypeFactory<'misc', typeof MiscDataTypeConditions>;

export type DataTypeConfigs =
  | BooleanDataTypeConfig
  | TextDataTypeConfig
  | NumberDataTypeConfig
  | DateDataTypeConfig
  | MultiSelectDataTypeConfig
  | SelectDataTypeConfig
  | MiscDataTypeConfig;

export const propertyConfigs: Record<PropertyType, DataTypeConfigs> = {
  updatedBy: {
    datatype: 'multi_select',
    conditions: MultiSelectDataTypeConditions
  },
  updatedTime: {
    datatype: 'date',
    conditions: DateDataTypeConditions
  },
  checkbox: {
    datatype: 'boolean',
    conditions: BooleanDataTypeConditions
  },
  createdBy: {
    datatype: 'date',
    conditions: DateDataTypeConditions
  },
  createdTime: {
    datatype: 'date',
    conditions: DateDataTypeConditions
  },
  date: {
    datatype: 'date',
    conditions: DateDataTypeConditions
  },
  email: {
    datatype: 'text',
    conditions: TextDataTypeConditions
  },
  file: {
    datatype: 'misc',
    conditions: MiscDataTypeConditions
  },
  multiSelect: {
    datatype: 'multi_select',
    conditions: MultiSelectDataTypeConditions
  },
  number: {
    datatype: 'number',
    conditions: NumberDataTypeConditions
  },
  person: {
    datatype: 'multi_select',
    conditions: MultiSelectDataTypeConditions
  },
  phone: {
    datatype: 'text',
    conditions: TextDataTypeConditions
  },
  select: {
    datatype: 'select',
    conditions: SelectDataTypeConditions
  },
  text: {
    datatype: 'text',
    conditions: TextDataTypeConditions
  },
  url: {
    datatype: 'text',
    conditions: TextDataTypeConditions
  }
};

export type FilterCondition = DataTypeConfigs['conditions'][number];

export type FilterClause = {
  propertyId: string;
  condition: DataTypeConfigs['conditions'][number];
  values: string[];
  filterId: string;
};

function createFilterClause(o?: FilterClause): FilterClause {
  return {
    propertyId: o?.propertyId || '',
    condition: o?.condition || 'contains',
    values: o?.values?.slice() || [],
    filterId: o?.filterId || v4()
  };
}

function areEqual(a: FilterClause, b: FilterClause): boolean {
  return a.propertyId === b.propertyId && a.condition === b.condition && arrayEquals(a.values, b.values);
}

export { createFilterClause, areEqual };
