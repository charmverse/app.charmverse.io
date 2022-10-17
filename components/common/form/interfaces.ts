import type { MemberPropertyType } from '@prisma/client';
import type { ChangeEvent } from 'react';

// TODO: We might need more generic types in the future
export type FieldType = MemberPropertyType

export type ControlFieldProps = {
  onChange: (e: ChangeEvent) => void;
  value: string;
}

export type FieldProps = {
  label?: string;
  inline?: boolean;
  error?: string;
};
