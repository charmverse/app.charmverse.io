import arrayEquals from 'lodash/isEqual';
import { v4 } from 'uuid';

type FilterCondition = 'includes' | 'notIncludes' | 'isEmpty' | 'isNotEmpty';

type FilterClause = {
  propertyId: string;
  condition: FilterCondition;
  values: string[];
  filterId: string;
};

function createFilterClause(o?: FilterClause): FilterClause {
  return {
    propertyId: o?.propertyId || '',
    condition: o?.condition || 'includes',
    values: o?.values?.slice() || [],
    filterId: o?.filterId || v4()
  };
}

function areEqual(a: FilterClause, b: FilterClause): boolean {
  return a.propertyId === b.propertyId && a.condition === b.condition && arrayEquals(a.values, b.values);
}

export { createFilterClause, areEqual };
export type { FilterClause, FilterCondition };
