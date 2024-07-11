import type { BoardPropertyValue, PageProperty } from '@root/lib/public-api/interfaces';

export type ValueToValidate = {
  value: BoardPropertyValue;
  schema: PageProperty;
};

export type MapperFunctionFromApiToSystem = (input: ValueToValidate) => BoardPropertyValue;
