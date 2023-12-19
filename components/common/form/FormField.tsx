import { type FormFieldType } from '@charmverse/core/prisma-client';
import styled from '@emotion/styled';
import { MoreHoriz } from '@mui/icons-material';
import ExpandMoreIcon from '@mui/icons-material/ArrowDropDown';
import ChevronRightIcon from '@mui/icons-material/ArrowRight';
import ContentCopyOutlinedIcon from '@mui/icons-material/ContentCopyOutlined';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import {
  Chip,
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
import { useDrag, useDrop } from 'react-dnd';

import { mergeRefs } from 'lib/utilities/react';

import PopperPopup from '../PopperPopup';

import { fieldTypeIconRecord, fieldTypeLabelRecord, fieldTypePlaceholderRecord, formFieldTypes } from './constants';
import { FieldTypeRenderer } from './fields/FieldTypeRenderer';
import type { SelectOptionType } from './fields/Select/interfaces';
import type { FormFieldInput } from './interfaces';

const FormFieldContainer = styled(Stack, {
  shouldForwardProp(propName) {
    return propName !== 'dragDirection';
  }
})<{ dragDirection?: 'top' | 'bottom' }>`
  border: 1px solid ${({ theme }) => theme.palette.divider};
  box-shadow: ${({ dragDirection, theme }) =>
    dragDirection === 'top'
      ? `0px -2px 0px ${theme.palette.primary.main}`
      : dragDirection === 'bottom'
      ? `0px 2px 0px ${theme.palette.primary.main}`
      : 'none'};
  padding: ${(props) => props.theme.spacing(1)};
  gap: ${(props) => props.theme.spacing(1)};
  flex-direction: row;
  align-items: flex-start;
  width: 100%;
`;

export interface FormFieldProps {
  updateFormField: (updatedFormField: Partial<FormFieldInput> & { id: string }) => void;
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
        <Select<FormFieldType>
          value={formField.type}
          onChange={(e) =>
            updateFormField({
              type: e.target.value as FormFieldType,
              id: formField.id
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
        onChange={(e) => updateFormField({ name: e.target.value, id: formField.id })}
        placeholder='Title (required)'
        error={!formField.name}
      />
      <TextField
        value={formField.description}
        onChange={(e) => updateFormField({ description: e.target.value, id: formField.id })}
        sx={{
          backgroundColor: 'background.light',
          border: 'none'
        }}
        placeholder='Add your description here (optional)'
      />
      <FieldTypeRenderer
        type={formField.type as any}
        onCreateOption={onCreateOption}
        onDeleteOption={onDeleteOption}
        onUpdateOption={onUpdateOption}
        placeholder={fieldTypePlaceholderRecord[formField.type]}
        // Enable select and multiselect fields to be able to create options
        disabled={formField.type !== 'select' && formField.type !== 'multiselect'}
        value={formField.type === 'date' ? new Date().toString() : ''}
        options={formField.options}
      />
      <Divider
        sx={{
          my: 1
        }}
      />

      {formField.type !== 'label' && (
        <Stack gap={0.5} flexDirection='row' alignItems='center'>
          <Switch
            size='small'
            checked={formField.required}
            onChange={(e) => updateFormField({ required: e.target.checked, id: formField.id })}
          />
          <Typography>Required</Typography>
        </Stack>
      )}

      <Stack>
        <Stack gap={0.5} flexDirection='row' alignItems='center'>
          <Switch
            size='small'
            checked={formField.private}
            onChange={(e) => updateFormField({ private: e.target.checked, id: formField.id })}
          />
          <Typography>Private</Typography>
        </Stack>
        <Typography variant='caption'>Only Authors, Reviewers and Admins can see the input</Typography>
      </Stack>
    </>
  );
}

export function FormField(
  props: FormFieldProps & {
    isOpen?: boolean;
  }
) {
  const { isOpen, formField, toggleOpen, updateFormField } = props;

  const [{ offset }, drag, dragPreview] = useDrag(() => ({
    type: 'item',
    item: formField,
    collect(monitor) {
      return {
        offset: monitor.getDifferenceFromInitialOffset()
      };
    }
  }));

  const [{ canDrop, isOverCurrent }, drop] = useDrop<FormFieldInput, any, { canDrop: boolean; isOverCurrent: boolean }>(
    () => ({
      canDrop(item) {
        return item.id !== formField.id;
      },
      accept: 'item',
      drop: async (droppedProperty, monitor) => {
        const didDrop = monitor.didDrop();
        if (didDrop) {
          return;
        }
        updateFormField({
          index: formField.index,
          id: droppedProperty.id
        });
      },
      collect: (monitor) => {
        let canDropItem: boolean = true;
        try {
          canDropItem = monitor.canDrop();
        } catch {
          canDropItem = false;
        }
        return {
          isOverCurrent: monitor.isOver({ shallow: true }),
          canDrop: canDropItem
        };
      }
    }),
    [formField]
  );

  const isAdjacentActive = canDrop && isOverCurrent;

  return (
    <Stack flexDirection='row' gap={1} alignItems='flex-start' ref={mergeRefs([dragPreview, drop])}>
      <div ref={drag}>
        <DragIndicatorIcon
          color='secondary'
          sx={{
            cursor: 'pointer'
          }}
        />
      </div>
      <FormFieldContainer dragDirection={isAdjacentActive ? ((offset?.y ?? 0) < 0 ? 'top' : 'bottom') : undefined}>
        {isOpen ? (
          <ExpandMoreIcon onClick={toggleOpen} sx={{ cursor: 'pointer' }} />
        ) : (
          <ChevronRightIcon onClick={toggleOpen} sx={{ cursor: 'pointer' }} />
        )}
        <Stack gap={1} width='100%'>
          {!isOpen ? (
            <FieldTypeRenderer
              fieldWrapperSx={{
                my: 0
              }}
              endAdornment={formField.private ? <Chip sx={{ mx: 1 }} label='Private' size='small' /> : undefined}
              type={formField.type as any}
              description={formField.description ?? ''}
              disabled
              label={formField.name}
              required={formField.required}
              options={formField.options}
              placeholder={fieldTypePlaceholderRecord[formField.type]}
            />
          ) : (
            <ExpandedFormField {...props} />
          )}
        </Stack>
      </FormFieldContainer>
    </Stack>
  );
}
