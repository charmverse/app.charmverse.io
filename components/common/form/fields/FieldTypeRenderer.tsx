import { Box, Stack, Typography } from '@mui/material';
import { forwardRef } from 'react';

import { NumberInputField } from 'components/common/form/fields/NumberInputField';
import { SelectField } from 'components/common/form/fields/SelectField';
import { TextInputField } from 'components/common/form/fields/TextInputField';
import type { ControlFieldProps, FieldProps, FieldType } from 'components/common/form/interfaces';

import FieldLabel from '../FieldLabel';

import { CharmEditorInputField } from './CharmEditorInputField';
import { DateInputField } from './DateInputField';
import { InlineCharmEditorInputField } from './InlineCharmEditorInputField';
import { PersonInputField } from './PersonInputField';

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
      case 'email':
      case 'url':
      case 'phone':
      case 'wallet': {
        return <TextInputField {...fieldProps} ref={ref} />;
      }
      case 'short_text': {
        return <InlineCharmEditorInputField {...fieldProps} ref={ref} />;
      }
      case 'long_text': {
        return <CharmEditorInputField {...fieldProps} ref={ref} />;
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
        return (
          <Stack my={1}>
            <Box alignItems='center' display='flex' gap={1}>
              <FieldLabel noWrap>{fieldProps.label}</FieldLabel>
            </Box>
            {fieldProps.description && (
              <Typography variant='body2' mb={1}>
                {fieldProps.description}
              </Typography>
            )}
          </Stack>
        );
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
