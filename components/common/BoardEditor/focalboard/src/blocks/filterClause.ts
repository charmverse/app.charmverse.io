import { Utils } from '../utils';

type FilterCondition = 'includes' | 'notIncludes' | 'isEmpty' | 'isNotEmpty'

type FilterClause = {
    propertyId: string;
    condition: FilterCondition;
    values: string[];
}

function createFilterClause (o?: FilterClause): FilterClause {
  return {
    propertyId: o?.propertyId || '',
    condition: o?.condition || 'includes',
    values: o?.values?.slice() || []
  };
}

function areEqual (a: FilterClause, b: FilterClause): boolean {
  return (
    a.propertyId === b.propertyId
        && a.condition === b.condition
        && Utils.arraysEqual(a.values, b.values)
  );
}

export { createFilterClause, areEqual };
export type { FilterClause, FilterCondition };
