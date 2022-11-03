import type { MemberPropertyType } from '@prisma/client';
import type { ReactNode } from 'react';

import type { SelectOptionType } from 'components/common/form/fields/Select/interfaces';

// TODO: We might need more generic types in the future
export type FieldType = MemberPropertyType

export type ControlFieldProps = {
  onChange: (value: any) => void;
  value: string;
}

export type FieldProps = {
  label?: string;
  iconLabel?: ReactNode;
  inline?: boolean;
  error?: string;
  options?: SelectOptionType[];
};
