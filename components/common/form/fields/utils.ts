import type { MemberPropertyType } from '@prisma/client';

export function isSelectType (type: MemberPropertyType | null) {
  return type === 'select' || type === 'multiselect';
}
