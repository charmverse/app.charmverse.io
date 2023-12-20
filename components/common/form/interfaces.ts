import type { MemberPropertyType, FormFieldType } from '@charmverse/core/prisma';
import type { FormField, Prisma } from '@charmverse/core/prisma-client';
import type { SxProps } from '@mui/material';
import type { ReactNode } from 'react';

import type { SelectOptionType } from 'components/common/form/fields/Select/interfaces';
import type { PageContent } from 'lib/prosemirror/interfaces';

export type FieldType = MemberPropertyType | FormFieldType;

export type FormFieldValue =
  | string
  | string[]
  | {
      content: PageContent;
      contentText: string;
    };

export type ControlFieldProps = {
  onChange?: (value: any) => void;
  value?: FormFieldValue;
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
  description?: PageContent;
  endAdornment?: ReactNode;
  fieldWrapperSx?: SxProps;
} & SelectFieldProps;

export type FormFieldInput = Pick<
  FormField,
  'id' | 'description' | 'name' | 'index' | 'required' | 'private' | 'type'
> & {
  options?: SelectOptionType[];
};

export type FieldAnswerInput = {
  id?: string;
  fieldId: string;
  value: string | string[];
};
