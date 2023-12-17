import { type ProposalFormFieldType } from '@charmverse/core/prisma-client';
import styled from '@emotion/styled';
import { MoreHoriz } from '@mui/icons-material';
import ContentCopyOutlinedIcon from '@mui/icons-material/ContentCopyOutlined';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import {
  Divider,
  IconButton,
  ListItemIcon,
  MenuItem,
  MenuList,
  Select,
  Stack,
  Switch,
  TextField,
  Typography
} from '@mui/material';
import { useState } from 'react';

import { Button } from '../Button';
import { DateInputField } from '../form/fields/DateInputField';
import { NumberInputField } from '../form/fields/NumberInputField';
import { SelectField } from '../form/fields/SelectField';
import { TextInputField } from '../form/fields/TextInputField';
import PopperPopup from '../PopperPopup';

import { fieldTypeIconRecord, fieldTypeLabelRecord, formFieldTypes } from './constants';
import type { ProposalFormFieldInput } from './interfaces';

const FormFieldContainer = styled(Stack)`
  border: 1px solid ${(props) => props.theme.palette.divider};
  padding: ${(props) => props.theme.spacing(2)};
  gap: ${(props) => props.theme.spacing(1)};
`;

interface FormFieldProps {
  formField: ProposalFormFieldInput;
  updateFormField: (updatedFormField: Partial<ProposalFormFieldInput>) => void;
  onDuplicate: VoidFunction;
  onDelete: VoidFunction;
  toggleOpen: VoidFunction;
}

function FormFieldInput({
  type,
  label,
  required = false,
  description
}: {
  type: ProposalFormFieldType;
  label?: string;
  required?: boolean;
  description?: string;
}) {
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
          description={description}
          placeholder='Your answer'
          multiline={type === 'text_multiline'}
          rows={type === 'text_multiline' ? 3 : 1}
          required={required}
          label={label}
        />
      );
    }
    case 'number': {
      return (
        <NumberInputField
          label={label}
          required={required}
          description={description}
          disabled
          placeholder='Your answer'
        />
      );
    }
    case 'date': {
      return (
        <DateInputField
          label={label}
          required={required}
          value={new Date().toString()}
          onChange={() => {}}
          disabled
          placeholder='Your answer'
          description={description}
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
          required={required}
          label={label}
          description={description}
        />
      );
    }
    default: {
      return null;
    }
  }
}

function ExpandedFormField({ formField, onDelete, onDuplicate, updateFormField }: Omit<FormFieldProps, 'isCollapsed'>) {
  return (
    <>
      <Stack flexDirection='row' justifyContent='space-between' alignItems='center'>
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
        <PopperPopup
          closeOnClick
          popupContent={
            <MenuList>
              <MenuItem onClick={onDuplicate}>
                <ListItemIcon>
                  <ContentCopyOutlinedIcon fontSize='small' />
                </ListItemIcon>
                <Typography variant='subtitle1'>Duplicate</Typography>
              </MenuItem>
              <MenuItem onClick={onDelete}>
                <ListItemIcon>
                  <DeleteOutlinedIcon fontSize='small' />
                </ListItemIcon>
                <Typography variant='subtitle1'>Delete</Typography>
              </MenuItem>
            </MenuList>
          }
        >
          <IconButton size='small'>
            <MoreHoriz fontSize='small' />
          </IconButton>
        </PopperPopup>
      </Stack>
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

      <Stack>
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
    </>
  );
}

export function FormField(
  props: FormFieldProps & {
    isOpen?: boolean;
  }
) {
  return (
    <FormFieldContainer>
      {!props.isOpen ? (
        <FormFieldInput
          type={props.formField.type}
          description={props.formField.description ?? ''}
          label={props.formField.name}
          required={props.formField.required}
        />
      ) : (
        <ExpandedFormField {...props} />
      )}
      <Button
        color='secondary'
        variant='outlined'
        onClick={props.toggleOpen}
        size='small'
        sx={{
          width: 'fit-content'
        }}
      >
        {!props.isOpen ? 'Expand' : 'Collapse'}
      </Button>
    </FormFieldContainer>
  );
}
