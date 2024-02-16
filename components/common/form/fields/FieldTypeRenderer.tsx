import { forwardRef } from 'react';

import { NumberInputField } from 'components/common/form/fields/NumberInputField';
import { SelectField } from 'components/common/form/fields/SelectField';
import { TextInputField } from 'components/common/form/fields/TextInputField';
import type { ControlFieldProps, FieldProps, FieldType } from 'components/common/form/interfaces';
import type { UploadedFileInfo } from 'hooks/useS3UploadInput';

import { CharmEditorInputField } from './CharmEditorInputField';
import { DateInputField } from './DateInputField';
import { FileField } from './FileField';
import { ImageField } from './ImageField';
import { LabelField } from './LabelField';
import { PersonInputField } from './PersonInputField';

type TextInputConfig = {
  rows?: number;
  maxRows?: number;
};

type TextProps = {
  type: Exclude<FieldType, 'select' | 'multiselect'>;
} & FieldProps &
  ControlFieldProps;

type SelectProps = {
  type: 'select' | 'multiselect';
} & FieldProps &
  Required<ControlFieldProps>;

type Props = (Omit<TextProps, 'type'> | Omit<SelectProps, 'type'>) & {
  type: FieldType;
  textInputConfig?: TextInputConfig;
} & TextInputConfig;

export const FieldTypeRenderer = forwardRef<HTMLDivElement, Props>(
  ({ type, options, onCreateOption, onDeleteOption, onUpdateOption, ...fieldProps }: Props, ref) => {
    switch (type) {
      case 'text':
      case 'email':
      case 'url':
      case 'phone':
      case 'short_text':
      case 'wallet': {
        return <TextInputField rows={1} maxRows={1} {...fieldProps} ref={ref} multiline />;
      }
      case 'long_text': {
        return <CharmEditorInputField {...fieldProps} />;
      }
      case 'text_multiline': {
        return <TextInputField rows={3} {...fieldProps} ref={ref} multiline />;
      }
      case 'number': {
        return <NumberInputField {...fieldProps} fullWidth ref={ref} />;
      }

      case 'date': {
        return <DateInputField {...fieldProps} ref={ref} />;
      }

      case 'person': {
        return <PersonInputField {...fieldProps} ref={ref} />;
      }

      case 'label': {
        return <LabelField {...fieldProps} />;
      }

      case 'multiselect':
      case 'select': {
        return (
          <SelectField
            {...(fieldProps as SelectProps)}
            error={fieldProps.error || (options ?? []).length === 0 ? 'Atleast one option is required' : undefined}
            ref={ref}
            placeholder={(options ?? []).length === 0 ? 'Create an option' : fieldProps.placeholder}
            value={fieldProps.value as string[]}
            multiselect={type === 'multiselect'}
            options={options}
            onCreateOption={onCreateOption}
            onDeleteOption={onDeleteOption}
            onUpdateOption={onUpdateOption}
          />
        );
      }

      case 'image': {
        return <ImageField {...fieldProps} />;
      }

      case 'file': {
        return <FileField {...fieldProps} value={fieldProps.value as UploadedFileInfo} />;
      }

      default: {
        return null;
      }
    }
  }
);
