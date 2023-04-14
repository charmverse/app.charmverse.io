import arrayEquals from 'lodash/isEqual';
import { v4 } from 'uuid';

import type { PropertyType } from './board';

export const BooleanDataTypeConditions = ['is', 'is-not'] as const;

export const TextDataTypeConditions = [
  'is',
  'is-not',
  'contains',
  'does-not-contain',
  'starts-with',
  'ends-with',
  'is-empty',
  'is-not-empty'
] as const;

export const NumberDataTypeConditions = [
  'equal',
  'not-equal',
  'greater-than',
  'less-than',
  'greater-than-equal',
  'less-than-equal',
  'is-empty',
  'is-not-empty'
] as const;

export const DateDataTypeConditions = [
  'is',
  'is-not',
  'is-before',
  'is-after',
  'is-on-or-before',
  'is-on-or-after',
  'is-empty',
  'is-not-empty'
] as const;

export const MultiSelectDataTypeConditions = ['contains', 'does-not-contain', 'is-empty', 'is-not-empty'] as const;

export const SelectDataTypeConditions = ['is', 'is-not', 'is-empty', 'is-not-empty'] as const;

export const MiscDataTypeConditions = ['is-empty', 'is-not-empty'] as const;

export type DataType = 'text' | 'number' | 'boolean' | 'date' | 'multi-select' | 'select' | 'misc';

export type DataTypeFactory<DT extends DataType, DataTypeDataTypeConditions extends readonly string[]> = {
  datatype: DT;
  conditions: readonly DataTypeDataTypeConditions[number][];
};

export type BooleanDataTypeConfig = DataTypeFactory<'boolean', typeof BooleanDataTypeConditions>;
export type TextDataTypeConfig = DataTypeFactory<'text', typeof TextDataTypeConditions>;
export type NumberDataTypeConfig = DataTypeFactory<'number', typeof NumberDataTypeConditions>;
export type DateDataTypeConfig = DataTypeFactory<'date', typeof DateDataTypeConditions>;
export type MultiSelectDataTypeConfig = DataTypeFactory<'multi-select', typeof MultiSelectDataTypeConditions>;
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
    datatype: 'multi-select',
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
    datatype: 'multi-select',
    conditions: MultiSelectDataTypeConditions
  },
  number: {
    datatype: 'number',
    conditions: NumberDataTypeConditions
  },
  person: {
    datatype: 'multi-select',
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
