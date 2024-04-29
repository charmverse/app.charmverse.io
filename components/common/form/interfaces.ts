import type { ReactNode } from 'react';

import type { SelectOptionType } from 'components/common/form/fields/Select/interfaces';
import type { FormFieldValue } from 'lib/forms/interfaces';
import type { PageContent } from 'lib/prosemirror/interfaces';

export type SelectFieldProps = {
  options?: SelectOptionType[];
  isEditable?: boolean;
  onCreateOption?: (option: SelectOptionType) => void;
  onUpdateOption?: (option: SelectOptionType) => void;
  onDeleteOption?: (option: SelectOptionType) => void;
};

export type ControlFieldProps<T extends FormFieldValue = FormFieldValue> = {
  onChange?: (value: any) => void;
  value?: T;
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
  topComponent?: ReactNode;
  inputEndAdornmentAlignItems?: React.CSSProperties['alignItems'];
} & SelectFieldProps;
