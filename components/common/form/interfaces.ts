import type { FormFieldType, MemberPropertyType } from '@charmverse/core/prisma';
import type { FormField } from '@charmverse/core/prisma-client';
import type { ReactNode } from 'react';

import type { SelectOptionType } from 'components/common/form/fields/Select/interfaces';
import type { UploadedFileInfo } from 'hooks/useS3UploadInput';
import type { PageContent } from 'lib/prosemirror/interfaces';

export type FieldType = MemberPropertyType | FormFieldType;

export type FormFieldValue =
  | string
  | string[]
  | {
      content: PageContent;
      contentText: string;
    }
  | UploadedFileInfo
  | {
      projectId: string;
      selectedMemberIds: string[];
    };

export type ControlFieldProps<T extends FormFieldValue = FormFieldValue> = {
  onChange?: (value: any) => void;
  value?: T;
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
  labelEndAdornment?: ReactNode;
  inputEndAdornment?: ReactNode;
  inputEndAdornmentAlignItems?: React.CSSProperties['alignItems'];
} & SelectFieldProps;

export type FormFieldInput = Pick<
  FormField,
  'id' | 'description' | 'name' | 'index' | 'required' | 'private' | 'type' | 'fieldConfig'
> & {
  options?: SelectOptionType[];
};

export type FieldAnswerInput = {
  id?: string;
  fieldId: string;
  value: FormFieldValue;
};
