import { ProposalFormFieldType } from '@charmverse/core/prisma-client';
import styled from '@emotion/styled';
import { Divider, MenuItem, Select, Stack, Switch, TextField, Typography } from '@mui/material';

import { fieldTypeIconRecord, fieldTypeLabelRecord } from './constants';
import type { ProposalFormFieldInput } from './interfaces';

const FormFieldContainer = styled(Stack)`
  border: 1px solid ${(props) => props.theme.palette.divider};
  padding: ${(props) => props.theme.spacing(2)};
  gap: ${(props) => props.theme.spacing(1)};
`;

function FormFieldInput({ type }: { type: ProposalFormFieldType }) {
  switch (type) {
    case 'text': {
      return (
        <TextField
          sx={{
            padding: 1
          }}
          disabled
          placeholder='Your answer'
          variant='outlined'
        />
      );
    }
    case 'text_multiline': {
      return (
        <TextField
          sx={{
            padding: 1
          }}
          disabled
          multiline
          placeholder='Your answer'
          rows={3}
          variant='outlined'
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
        size='small'
      >
        {Object.keys(ProposalFormFieldType).map((fieldType) => {
          return (
            <MenuItem key={fieldType} value={fieldType}>
              <Stack flexDirection='row' gap={1} alignItems='center'>
                {fieldTypeIconRecord[fieldType as ProposalFormFieldType]}
                {fieldTypeLabelRecord[fieldType as ProposalFormFieldType]}
              </Stack>
            </MenuItem>
          );
        })}
      </Select>
      <TextField
        value={formField.name}
        onChange={(e) => updateFormField({ name: e.target.value })}
        sx={{
          backgroundColor: 'background.light',
          border: 'none'
        }}
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
