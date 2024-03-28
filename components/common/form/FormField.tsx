import { type FormFieldType } from '@charmverse/core/prisma-client';
import { useTheme } from '@emotion/react';
import styled from '@emotion/styled';
import { Edit, EditOff, MoreHoriz } from '@mui/icons-material';
import ContentCopyOutlinedIcon from '@mui/icons-material/ContentCopyOutlined';
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import {
  Box,
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
import { useEffect, useMemo, useRef } from 'react';
import { useDrag, useDrop } from 'react-dnd';

import { ProjectFormEditor } from 'components/settings/projects/ProjectForm';
import { useIsCharmverseSpace } from 'hooks/useIsCharmverseSpace';
import type { ProjectFieldConfig } from 'lib/projects/interfaces';
import { emptyDocument } from 'lib/prosemirror/constants';
import type { PageContent } from 'lib/prosemirror/interfaces';
import { mergeRefs } from 'lib/utils/react';

import { CharmEditor } from '../CharmEditor';
import PopperPopup from '../PopperPopup';

import {
  fieldTypeIconRecord,
  fieldTypeLabelRecord,
  fieldTypePlaceholderRecord,
  formFieldTypes,
  nonDuplicateFieldTypes
} from './constants';
import { FieldTypeRenderer } from './fields/FieldTypeRenderer';
import type { SelectOptionType } from './fields/Select/interfaces';
import type { FormFieldInput } from './interfaces';

export const FormFieldContainer = styled(Stack, {
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
  position: relative;
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
  shouldFocus?: boolean;
  formFieldTypeFrequencyCount?: Record<FormFieldType, number>;
}

function ExpandedFormField({
  formField,
  onDelete,
  onDuplicate,
  updateFormField,
  onCreateOption,
  onDeleteOption,
  onUpdateOption,
  shouldFocus,
  formFieldTypeFrequencyCount
}: Omit<FormFieldProps, 'isCollapsed'>) {
  const theme = useTheme();
  const titleTextFieldRef = useRef<HTMLInputElement | null>(null);
  const isCharmverseSpace = useIsCharmverseSpace();
  // Auto focus on title text field when expanded
  useEffect(() => {
    if (titleTextFieldRef.current && shouldFocus) {
      titleTextFieldRef.current.querySelector('input')?.focus();
    }
  }, [titleTextFieldRef]);

  const formFieldType = formField.type;
  const filteredFormFieldTypes = useMemo(() => {
    if (!formFieldTypeFrequencyCount) {
      return formFieldTypes;
    }

    return formFieldTypes.filter((_formFieldType) => {
      if (!isCharmverseSpace && _formFieldType === 'project_profile') {
        return false;
      }

      const nonDuplicateFieldType = nonDuplicateFieldTypes.includes(_formFieldType);
      if (nonDuplicateFieldType) {
        return !formFieldTypeFrequencyCount[_formFieldType] || _formFieldType === formFieldType;
      }

      return true;
    });
  }, [formFieldTypeFrequencyCount, formFieldType, isCharmverseSpace]);

  return (
    <>
      <Stack flexDirection='row' justifyContent='space-between' alignItems='center' pr={4}>
        <Select<FormFieldType>
          data-test='form-field-type-select'
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
          {filteredFormFieldTypes.map((fieldType) => {
            return (
              <MenuItem data-test={`form-field-type-option-${fieldType}`} key={fieldType} value={fieldType}>
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
              <MenuItem data-test='delete-form-field' onClick={onDelete}>
                <ListItemIcon>
                  <DeleteOutlinedIcon fontSize='small' />
                </ListItemIcon>
                <Typography variant='subtitle1'>Delete</Typography>
              </MenuItem>
            </MenuList>
          }
        >
          <IconButton data-test='form-field-more-options-popup' size='small' sx={{ mt: '-20px' }}>
            <MoreHoriz fontSize='small' />
          </IconButton>
        </PopperPopup>
      </Stack>
      {formField.type !== 'project_profile' && (
        <>
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
            focusOnInit={false}
          />
        </>
      )}
      {formField.type === 'project_profile' ? (
        <ProjectFormEditor
          defaultRequired
          values={
            (formField.fieldConfig ?? {
              projectMember: {}
            }) as ProjectFieldConfig
          }
          onChange={(fieldConfig) => {
            updateFormField({
              id: formField.id,
              fieldConfig
            });
          }}
        />
      ) : (
        <FieldTypeRenderer
          rows={undefined}
          maxRows={10}
          type={formField.type as any}
          onCreateOption={onCreateOption}
          onDeleteOption={onDeleteOption}
          onUpdateOption={onUpdateOption}
          placeholder={fieldTypePlaceholderRecord[formField.type]}
          // Enable select and multiselect fields to be able to create options
          disabled={formField.type !== 'select' && formField.type !== 'multiselect'}
          options={formField.options}
        />
      )}
      <Divider
        sx={{
          my: 1
        }}
      />

      {formField.type !== 'label' && formField.type !== 'project_profile' && (
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

      {formField.type !== 'project_profile' && (
        <Stack gap={0.5} flexDirection='row' alignItems='center'>
          <Switch
            data-test='form-field-private-switch'
            size='small'
            checked={formField.private}
            onChange={(e) => updateFormField({ private: e.target.checked, id: formField.id })}
          />
          <Typography>Private (Authors & Reviewers can view)</Typography>
        </Stack>
      )}
    </>
  );
}

export function FormField(
  props: FormFieldProps & {
    isOpen?: boolean;
    readOnly?: boolean;
    forceFocus?: boolean;
  }
) {
  const { readOnly, isOpen, formField, toggleOpen, updateFormField, forceFocus } = props;
  const prevIsOpen = useRef(isOpen);
  const shouldFocus = (!prevIsOpen.current && isOpen) || forceFocus;

  useEffect(() => {
    prevIsOpen.current = isOpen;
  }, [isOpen]);

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
    <Stack
      flexDirection='row'
      gap={0.5}
      alignItems='flex-start'
      ref={readOnly ? null : mergeRefs([dragPreview, drop])}
      sx={{
        '&:hover .icons': {
          opacity: 1
        }
      }}
    >
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
        <Stack gap={1} width='100%' ml={1}>
          {!isOpen || readOnly ? (
            <div style={{ cursor: 'pointer' }} onClick={toggleOpen}>
              {formField.type === 'project_profile' ? (
                <ProjectFormEditor
                  values={(formField.fieldConfig as ProjectFieldConfig) ?? { projectMember: {} }}
                  defaultRequired
                />
              ) : (
                <FieldTypeRenderer
                  labelEndAdornment={
                    formField.private ? <Chip sx={{ mx: 1 }} label='Private' size='small' /> : undefined
                  }
                  type={formField.type as any}
                  description={formField.description as PageContent}
                  disabled
                  label={formField.name}
                  required={formField.required}
                  options={formField.options}
                  placeholder={fieldTypePlaceholderRecord[formField.type]}
                />
              )}
            </div>
          ) : (
            <ExpandedFormField {...props} shouldFocus={shouldFocus} />
          )}
        </Stack>

        {!readOnly ? (
          <Box
            className='icons'
            data-test='toggle-form-field-button'
            sx={{
              position: 'absolute',
              top: (theme) => theme.spacing(0.5),
              right: (theme) => theme.spacing(0.5),
              opacity: isOpen ? 1 : 0,
              transition: 'opacity 0.2s ease'
            }}
          >
            <IconButton size='small' onClick={toggleOpen}>
              {isOpen ? <EditOff color='secondary' fontSize='small' /> : <Edit color='secondary' fontSize='small' />}
            </IconButton>
          </Box>
        ) : null}
      </FormFieldContainer>
    </Stack>
  );
}
