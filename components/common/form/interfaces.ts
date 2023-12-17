import type { MemberPropertyType, ProposalFormFieldType } from '@charmverse/core/prisma';
import type { ProposalFormField } from '@charmverse/core/prisma-client';
import type { SxProps } from '@mui/material';
import type { ReactNode } from 'react';

import type { SelectOptionType } from 'components/common/form/fields/Select/interfaces';

// TODO: We might need more generic types in the future
export type FieldType = MemberPropertyType | ProposalFormFieldType;

export type ControlFieldProps = {
  onChange?: (value: any) => void;
  value?: string;
};

export type SelectFieldProps = {
  options?: SelectOptionType[];
  isEditable?: boolean;
  onCreateOption?: (option: SelectOptionType) => void;
  onUpdateOption?: (option: SelectOptionType) => void;
  onDeleteOption?: (option: SelectOptionType) => void;
};

export type FieldProps = {
  placeholder?: string;
  label?: string;
  iconLabel?: ReactNode;
  inline?: boolean;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  helperText?: ReactNode;
  description?: string;
  endAdornment?: ReactNode;
  fieldWrapperSx?: SxProps;
} & SelectFieldProps;

export type FormFieldInput = Pick<
  ProposalFormField,
  'description' | 'name' | 'index' | 'required' | 'private' | 'type'
> & {
  options?: SelectOptionType[];
};
