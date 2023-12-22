import { type FormFieldType } from '@charmverse/core/prisma-client';
import { useTheme } from '@emotion/react';
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
import { useEffect, useRef } from 'react';
import { useDrag, useDrop } from 'react-dnd';

import { emptyDocument } from 'lib/prosemirror/constants';
import type { PageContent } from 'lib/prosemirror/interfaces';
import { mergeRefs } from 'lib/utilities/react';

import { CharmEditor } from '../CharmEditor';
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
  padding-left: 0;
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
  const theme = useTheme();
  const titleTextFieldRef = useRef<HTMLInputElement | null>(null);

  // Auto focus on title text field when expanded
  useEffect(() => {
    if (titleTextFieldRef.current) {
      titleTextFieldRef.current.querySelector('input')?.focus();
    }
  }, [titleTextFieldRef]);

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
        ref={titleTextFieldRef}
        data-test='form-field-name-input'
      />
      <CharmEditor
        isContentControlled
        content={(formField.description ?? emptyDocument) as PageContent}
        onContentChange={({ doc }) => {
          updateFormField({
            description: doc,
            id: formField.id
          });
        }}
        colorMode='dark'
        style={{
          left: 0,
          paddingLeft: theme.spacing(2)
        }}
        disableMention
        disableNestedPages
        disablePageSpecificFeatures
        disableRowHandles
        placeholderText='Add your description here (optional)'
      />
      <FieldTypeRenderer
        type={formField.type as any}
        onCreateOption={onCreateOption}
        onDeleteOption={onDeleteOption}
        onUpdateOption={onUpdateOption}
        placeholder={fieldTypePlaceholderRecord[formField.type]}
        // Enable select and multiselect fields to be able to create options
        disabled={formField.type !== 'select' && formField.type !== 'multiselect'}
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
            data-test='form-field-required-switch'
            size='small'
            checked={formField.required}
            onChange={(e) => updateFormField({ required: e.target.checked, id: formField.id })}
          />
          <Typography>Required</Typography>
        </Stack>
      )}

      <Stack flexDirection='row' gap={0.5} alignItems='center'>
        <Switch
          size='small'
          checked={formField.private}
          onChange={(e) => updateFormField({ private: e.target.checked, id: formField.id })}
          data-test='form-field-private-switch'
        />
        <Stack>
          <Typography>Private</Typography>
          <Typography variant='caption'>Only Authors, Reviewers and Admins can see the input</Typography>
        </Stack>
      </Stack>
    </>
  );
}

export function FormField(
  props: FormFieldProps & {
    isOpen?: boolean;
    readOnly?: boolean;
  }
) {
  const { readOnly, isOpen, formField, toggleOpen, updateFormField } = props;

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
    <Stack flexDirection='row' gap={0.5} alignItems='flex-start' ref={readOnly ? null : mergeRefs([dragPreview, drop])}>
      {!readOnly && (
        <div ref={readOnly ? null : drag}>
          <DragIndicatorIcon
            fontSize='small'
            color='secondary'
            sx={{
              cursor: 'pointer'
            }}
          />
        </div>
      )}
      <FormFieldContainer dragDirection={isAdjacentActive ? ((offset?.y ?? 0) < 0 ? 'top' : 'bottom') : undefined}>
        {!readOnly ? (
          <span data-test='toggle-form-field-button'>
            {isOpen ? (
              <ExpandMoreIcon onClick={toggleOpen} sx={{ cursor: 'pointer', mt: 1 }} />
            ) : (
              <ChevronRightIcon onClick={toggleOpen} sx={{ cursor: 'pointer' }} />
            )}
          </span>
        ) : null}
        <Stack gap={1} width='100%' ml={readOnly ? 1 : 0}>
          {!isOpen || readOnly ? (
            <FieldTypeRenderer
              fieldWrapperSx={{
                my: 0
              }}
              endAdornment={formField.private ? <Chip sx={{ mx: 1 }} label='Private' size='small' /> : undefined}
              type={formField.type as any}
              description={formField.description as PageContent}
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
