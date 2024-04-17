import type { MemberPropertyType, Prisma } from '@charmverse/core/prisma';

export function isSelectType(type: MemberPropertyType | null) {
  return type === 'select' || type === 'multiselect';
}

export function isEmptyValue(value: string | string[] | null | number | undefined) {
  return value === null || value === undefined || value === '' || (Array.isArray(value) && value.length === 0);
}

export const isWalletConfig = (fieldConfig: Prisma.JsonValue): fieldConfig is { chainId: number } => {
  return fieldConfig ? 'chainId' in (fieldConfig as { chainId: number }) : false;
};
