import type { MemberPropertyType } from '@prisma/client';
import type { ChangeEvent, ReactNode } from 'react';

// TODO: We might need more generic types in the future
export type FieldType = MemberPropertyType

export type ControlFieldProps = {
  onChange: (e: ChangeEvent) => void;
  value: string;
}

export type FieldProps = {
  label?: string;
  iconLabel?: ReactNode;
  inline?: boolean;
  error?: string;
};
