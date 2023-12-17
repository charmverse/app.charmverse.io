import { type ProposalFormFieldType } from '@charmverse/core/prisma-client';
import styled from '@emotion/styled';
import { Divider, MenuItem, Select, Stack, Switch, TextField, Typography } from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers';

import { NumberInputField } from '../form/fields/NumberInputField';
import { SelectField } from '../form/fields/SelectField';
import { TextInputField } from '../form/fields/TextInputField';

import { fieldTypeIconRecord, fieldTypeLabelRecord, formFieldTypes } from './constants';
import type { ProposalFormFieldInput } from './interfaces';

const FormFieldContainer = styled(Stack)`
  border: 1px solid ${(props) => props.theme.palette.divider};
  padding: ${(props) => props.theme.spacing(2)};
  gap: ${(props) => props.theme.spacing(1)};
`;

function FormFieldInput({ type }: { type: ProposalFormFieldType }) {
  switch (type) {
    case 'text':
    case 'email':
    case 'url':
    case 'phone':
    case 'label':
    case 'text_multiline':
    case 'wallet': {
      return (
        <TextInputField
          disabled
          placeholder='Your answer'
          multiline={type === 'text_multiline'}
          rows={type === 'text_multiline' ? 3 : 1}
        />
      );
    }
    case 'number': {
      return <NumberInputField disabled placeholder='Your answer' />;
    }
    case 'date': {
      return (
        <DateTimePicker
          value={new Date()}
          onChange={() => {}}
          disabled
          renderInput={(props) => <TextField placeholder='Your answer' fullWidth {...props} />}
        />
      );
    }
    case 'select':
    case 'person':
    case 'multiselect': {
      return (
        <SelectField
          disabled
          multiselect={type === 'multiselect'}
          options={[]}
          placeholder='Your answer'
          onChange={() => {}}
          value=''
        />
      );
    }
    default: {
      return null;
    }
  }
}

export function FormField({
  formField,
  updateFormField
}: {
  formField: ProposalFormFieldInput;
  updateFormField: (updatedFormField: Partial<ProposalFormFieldInput>) => void;
}) {
  return (
    <FormFieldContainer>
      <Select<ProposalFormFieldType>
        value={formField.type}
        onChange={(e) =>
          updateFormField({
            type: e.target.value as ProposalFormFieldType
          })
        }
        sx={{
          width: 'fit-content'
        }}
        variant='outlined'
      >
        {formFieldTypes.map((fieldType) => {
          return (
            <MenuItem key={fieldType} value={fieldType}>
              <Stack flexDirection='row' gap={1} alignItems='center'>
                {fieldTypeIconRecord[fieldType]}
                {fieldTypeLabelRecord[fieldType]}
              </Stack>
            </MenuItem>
          );
        })}
      </Select>
      <TextField
        value={formField.name}
        onChange={(e) => updateFormField({ name: e.target.value })}
        placeholder='Title'
      />
      <TextField
        value={formField.description}
        onChange={(e) => updateFormField({ description: e.target.value })}
        sx={{
          backgroundColor: 'background.light',
          border: 'none'
        }}
        placeholder='Add your description here (optional)'
      />
      <FormFieldInput type={formField.type} />
      <Divider
        sx={{
          my: 1
        }}
      />

      <Stack>
        <Stack gap={0.5} flexDirection='row' alignItems='center'>
          <Switch
            size='small'
            checked={formField.required}
            onChange={(e) => updateFormField({ required: e.target.checked })}
          />
          <Typography>Required</Typography>
        </Stack>
        <Typography variant='caption'>Authors must answer this question</Typography>
      </Stack>

      <Stack my={1}>
        <Stack gap={0.5} flexDirection='row' alignItems='center'>
          <Switch
            size='small'
            checked={formField.private}
            onChange={(e) => updateFormField({ private: e.target.checked })}
          />
          <Typography>Private</Typography>
        </Stack>
        <Typography variant='caption'>Only Authors, Reviewers and Admins can see the answer</Typography>
      </Stack>
    </FormFieldContainer>
  );
}
