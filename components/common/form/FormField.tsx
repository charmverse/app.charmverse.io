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

import { Button } from '../Button';
import PopperPopup from '../PopperPopup';

import { fieldTypeIconRecord, fieldTypeLabelRecord, formFieldTypes } from './constants';
import { FieldTypeRenderer } from './fields/FieldTypeRenderer';
import type { SelectOptionType } from './fields/Select/interfaces';
import type { FormFieldInput } from './interfaces';

const FormFieldContainer = styled(Stack)`
  border: 1px solid ${(props) => props.theme.palette.divider};
  padding: ${(props) => props.theme.spacing(2)};
  gap: ${(props) => props.theme.spacing(1)};
`;

export interface FormFieldProps {
  updateFormField: (updatedFormField: Partial<FormFieldInput>) => void;
  onDuplicate: VoidFunction;
  onDelete: VoidFunction;
  toggleOpen: VoidFunction;
  formField: FormFieldInput;
  onCreateOption?: (option: SelectOptionType) => void;
  onDeleteOption?: (option: SelectOptionType) => void;
  onUpdateOption?: (option: SelectOptionType) => void;
}

function ExpandedFormField({
  formField,
  onDelete,
  onDuplicate,
  updateFormField,
  onCreateOption,
  onDeleteOption,
  onUpdateOption
}: Omit<FormFieldProps, 'isCollapsed'>) {
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
      {formField.type !== 'label' && (
        <FieldTypeRenderer
          type={formField.type as any}
          onCreateOption={onCreateOption}
          onDeleteOption={onDeleteOption}
          onUpdateOption={onUpdateOption}
          placeholder='Your answer'
          // Enable select and multiselect fields to be able to create options
          disabled={formField.type !== 'select' && formField.type !== 'multiselect'}
          value={formField.type === 'date' ? new Date().toString() : ''}
          options={formField.options}
        />
      )}
      <Divider
        sx={{
          my: 1
        }}
      />

      {formField.type !== 'label' && (
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
      )}

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
  const { isOpen, formField, toggleOpen } = props;

  return (
    <FormFieldContainer>
      {!isOpen ? (
        <FieldTypeRenderer
          type={formField.type as any}
          description={formField.description ?? ''}
          disabled
          label={formField.name}
          required={formField.required}
          options={formField.options}
          placeholder={formField.type === 'date' ? new Date().toString() : 'Your answer'}
        />
      ) : (
        <ExpandedFormField {...props} />
      )}
      <Button
        color='secondary'
        variant='outlined'
        onClick={toggleOpen}
        size='small'
        sx={{
          width: 'fit-content'
        }}
      >
        {!isOpen ? 'Expand' : 'Collapse'}
      </Button>
    </FormFieldContainer>
  );
}
