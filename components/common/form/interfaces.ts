import type { MemberPropertyType, FormFieldType } from '@charmverse/core/prisma';
import type { FormField, Prisma } from '@charmverse/core/prisma-client';
import type { SxProps } from '@mui/material';
import type { ReactNode } from 'react';

import type { SelectOptionType } from 'components/common/form/fields/Select/interfaces';

export type FieldType = MemberPropertyType | FormFieldType;

export type ControlFieldProps = {
  onChange?: (value: any) => void;
  value?: Prisma.JsonValue;
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

export type FormFieldInput = Omit<FormField, 'formId' | 'id' | 'parentFieldId' | 'options'> & {
  options?: SelectOptionType[];
};
