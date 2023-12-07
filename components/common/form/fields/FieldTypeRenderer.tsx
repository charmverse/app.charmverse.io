import { forwardRef } from 'react';

import { NumberInputField } from 'components/common/form/fields/NumberInputField';
import { SelectField } from 'components/common/form/fields/SelectField';
import { TextInputField } from 'components/common/form/fields/TextInputField';
import type { ControlFieldProps, FieldProps, FieldType } from 'components/common/form/interfaces';

type TextProps = {
  type: Exclude<FieldType, 'select' | 'multiselect'>;
} & FieldProps &
  ControlFieldProps;
type SelectProps = {
  type: Extract<FieldType, 'select' | 'multiselect'>;
} & FieldProps &
  Required<ControlFieldProps>;

type Props = TextProps | SelectProps;

export const FieldTypeRenderer = forwardRef<HTMLDivElement, Props>(
  ({ type, options, onCreateOption, onDeleteOption, onUpdateOption, ...fieldProps }: Props, ref) => {
    switch (type) {
      case 'text':
      case 'phone':
      case 'url':
      case 'name':
      case 'email': {
        return <TextInputField {...fieldProps} ref={ref} />;
      }
      case 'text_multiline': {
        return <TextInputField {...fieldProps} ref={ref} multiline rows={3} />;
      }
      case 'number': {
        return <NumberInputField {...fieldProps} ref={ref} />;
      }

      case 'select': {
        return (
          <SelectField
            {...(fieldProps as SelectProps)}
            ref={ref}
            options={options}
            onCreateOption={onCreateOption}
            onDeleteOption={onDeleteOption}
            onUpdateOption={onUpdateOption}
          />
        );
      }

      case 'multiselect': {
        return (
          <SelectField
            {...(fieldProps as SelectProps)}
            ref={ref}
            multiselect
            options={options}
            onCreateOption={onCreateOption}
            onDeleteOption={onDeleteOption}
            onUpdateOption={onUpdateOption}
          />
        );
      }

      default: {
        return null;
      }
    }
  }
);
