import type { MemberPropertyType } from '@prisma/client';

export function isSelectType(type: MemberPropertyType | null) {
  return type === 'select' || type === 'multiselect';
}

export function isEmptyValue(value: string | string[] | null | number | undefined) {
  return value === null || value === undefined || value === '' || (Array.isArray(value) && value.length === 0);
}
