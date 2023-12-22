import { forwardRef } from 'react';

import { NumberInputField } from 'components/common/form/fields/NumberInputField';
import { SelectField } from 'components/common/form/fields/SelectField';
import { TextInputField } from 'components/common/form/fields/TextInputField';
import type { ControlFieldProps, FieldProps, FieldType } from 'components/common/form/interfaces';

import { CharmEditorInputField } from './CharmEditorInputField';
import { DateInputField } from './DateInputField';
import { FieldWrapper } from './FieldWrapper';
import { PersonInputField } from './PersonInputField';

type TextProps = {
  type: Exclude<FieldType, 'select' | 'multiselect'>;
} & FieldProps &
  ControlFieldProps;

type SelectProps = {
  type: 'select' | 'multiselect';
} & FieldProps &
  Required<ControlFieldProps>;

type Props = TextProps | SelectProps;

export const FieldTypeRenderer = forwardRef<HTMLDivElement, Props>(
  ({ type, options, onCreateOption, onDeleteOption, onUpdateOption, ...fieldProps }: Props, ref) => {
    switch (type) {
      case 'text':
      case 'email':
      case 'url':
      case 'phone':
      case 'short_text':
      case 'wallet': {
        return <TextInputField {...fieldProps} ref={ref} />;
      }
      case 'long_text': {
        return <CharmEditorInputField {...fieldProps} />;
      }
      case 'text_multiline': {
        return <TextInputField {...fieldProps} ref={ref} multiline rows={3} />;
      }
      case 'number': {
        return <NumberInputField {...fieldProps} ref={ref} />;
      }

      case 'date': {
        return <DateInputField {...fieldProps} ref={ref} />;
      }

      case 'person': {
        return <PersonInputField {...fieldProps} ref={ref} />;
      }

      case 'label': {
        return <FieldWrapper {...fieldProps} sx={fieldProps?.fieldWrapperSx} />;
      }

      case 'select': {
        return (
          <SelectField
            {...(fieldProps as SelectProps)}
            value={fieldProps.value as string}
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
            value={fieldProps.value as string[]}
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
