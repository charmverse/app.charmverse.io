import styled from '@emotion/styled';
import { Stack } from '@mui/material';
import type { SelectOptionType } from '@root/lib/proposals/forms/interfaces';
import type { ReactNode } from 'react';
import { useCallback, useMemo, useState } from 'react';

import { SelectPreview } from 'components/common/form/fields/Select/SelectPreview';
import { SelectField } from 'components/common/form/fields/SelectField';
import { isEmptyValue } from 'components/common/form/fields/utils';
import type { IPropertyOption } from 'lib/databases/board';

import type { PropertyValueDisplayType } from '../../../interfaces';
import { PopupFieldWrapper } from '../PopupFieldWrapper';

import { mapPropertyOptionToSelectOption, mapValueToSelectOption, mapSelectOptionToPropertyOption } from './mappers';

type ContainerProps = {
  displayType?: PropertyValueDisplayType;
  disableClearable?: boolean;
  isHidden?: boolean;
  readOnly?: boolean;
  fluidWidth?: boolean;
};
export const SelectPreviewContainer = styled(Stack, {
  shouldForwardProp: (prop: string) =>
    prop !== 'displayType' && prop !== 'isHidden' && prop !== 'readOnly' && prop !== 'fluidWidth'
})<ContainerProps>`
  border-radius: ${({ theme }) => theme.spacing(0.5)};
  ${({ isHidden }) => (isHidden ? 'display: none;' : '')};
  ${({ fluidWidth }) => (!fluidWidth ? 'width: 100%;' : '')}
  height: 100%;
  justify-content: ${({ displayType }) => (displayType === 'table' ? 'flex-start' : 'center')}
  padding: ${({ theme, displayType }) => theme.spacing(displayType === 'table' ? 0 : 0.25, 0)};
  transition: background-color 0.2s ease-in-out;

  ${({ displayType, theme }) => {
    // Styles depending on a view type
    if (displayType === 'details') {
      return `
        min-height: 32px;
        min-width: 150px;
        padding: ${theme.spacing(0.5)} ${theme.spacing(1)};
        padding-right: ${theme.spacing(2)};
      `;
    }

    return '';
  }}

  ${({ readOnly, theme, displayType }) =>
    !readOnly &&
    `
    // disable hover UX on ios which converts first click to a hover event
    @media (pointer: fine) {
      &:hover {
        cursor: pointer;
        background-color: ${displayType === 'details' ? theme.palette.action.hover : 'transparent'};
      }
    }
    `}
`;

const StyledSelect = styled(SelectField)<ContainerProps>`
  ${({ fluidWidth }) => (!fluidWidth ? 'flex-grow: 1;' : '')}
  .MuiInputBase-root {
    background-color: ${({ theme }) => theme.palette.background.paper};
  }

  // override styles from focalboard
  .MuiInputBase-input {
    background: transparent;
    padding-top: 0 !important;
    padding-bottom: 0 !important;
  }

  .MuiInputBase-root.MuiInputBase-sizeSmall {
    padding: 4px;
  }

  // hide blue outline around focused input
  .MuiOutlinedInput-notchedOutline {
    border: 0 none !important;
  }

  /* Hide the clear icons on each tag - useful for requried selects */
  ${({ disableClearable }) => (disableClearable ? '.MuiSvgIcon-root { display: none; }' : '')}
`;

export type TagSelectProps = {
  defaultOpened?: boolean;
  readOnly?: boolean;
  readOnlyMessage?: string;
  canEditOptions?: boolean; // TODO: allow editing options
  multiselect?: boolean;
  includeSelectedOptions?: boolean;
  noOptionsText?: string;
  options: IPropertyOption[];
  propertyValue: string | string[];
  displayType?: PropertyValueDisplayType;
  disableClearable?: boolean;
  displayValueAsOptions?: boolean;
  onChange: (option: string | string[]) => void;
  onCreateOption?: (option: IPropertyOption) => void;
  onUpdateOption?: (option: IPropertyOption) => void;
  onDeleteOption?: (option: IPropertyOption) => void;
  wrapColumn?: boolean;
  'data-test'?: string;
  fluidWidth?: boolean;
  emptyMessage?: string;
  showEmpty?: boolean;
  'data-test-active'?: string;
};

export function TagSelect({
  readOnly,
  readOnlyMessage,
  canEditOptions = false,
  includeSelectedOptions,
  options,
  propertyValue,
  multiselect = false,
  onChange,
  onUpdateOption,
  onDeleteOption,
  onCreateOption,
  displayType = 'details',
  noOptionsText,
  wrapColumn,
  defaultOpened = false,
  disableClearable = false,
  displayValueAsOptions = false,
  fluidWidth,
  showEmpty,
  emptyMessage,
  'data-test': dataTest,
  'data-test-active': dataTestActive
}: TagSelectProps) {
  const [isOpened, setIsOpened] = useState(defaultOpened);

  const onEdit = useCallback(() => {
    if (!readOnly) {
      setIsOpened(true);
    }
  }, [readOnly]);

  const selectValue = useMemo(() => {
    if (multiselect) {
      return typeof propertyValue === 'string' ? [propertyValue] : propertyValue;
    } else {
      return Array.isArray(propertyValue) ? propertyValue[0] || '' : propertyValue;
    }
  }, [multiselect, propertyValue]);

  const selectOptions = useMemo(() => {
    return displayValueAsOptions
      ? Array.isArray(selectValue)
        ? selectValue.map((v) => mapValueToSelectOption(v))
        : [mapValueToSelectOption(selectValue)]
      : options.map((o) => mapPropertyOptionToSelectOption(o));
  }, [displayValueAsOptions, options, selectValue]);

  const onUpdate = useCallback(
    (selectOption: SelectOptionType) => {
      const option = mapSelectOptionToPropertyOption(selectOption);
      onUpdateOption?.(option);
    },
    [onUpdateOption]
  );

  const onDelete = useCallback(
    (selectOption: SelectOptionType) => {
      const option = mapSelectOptionToPropertyOption(selectOption);
      onDeleteOption?.(option);
    },
    [onDeleteOption]
  );

  const onCreate = useCallback(
    (selectOption: SelectOptionType) => {
      const option = mapSelectOptionToPropertyOption(selectOption);
      onCreateOption?.(option);
    },
    [onCreateOption]
  );

  if (displayType === 'kanban' && isEmptyValue(selectValue)) {
    return null;
  }

  const showInsidePopup = displayType === 'table';

  const activeField = (
    <StyledSelect
      data-test={dataTestActive}
      canEditOptions={canEditOptions}
      includeSelectedOptions={includeSelectedOptions}
      placeholder='Search for an option...'
      noOptionsText={noOptionsText}
      autoOpen
      multiselect={multiselect}
      disabled={readOnly}
      disableClearable={disableClearable}
      value={selectValue}
      options={selectOptions}
      onChange={onChange}
      onUpdateOption={onUpdate}
      onDeleteOption={onDelete}
      onCreateOption={onCreate}
      onBlur={() => {
        // HACK to defer close so the change event can fire
        setTimeout(() => {
          setIsOpened(false);
        }, 200);
      }}
      forcePopupIcon={false}
      displayType={displayType}
      fluidWidth={fluidWidth}
      disablePopper={showInsidePopup}
    />
  );

  const previewField = (
    <SelectPreviewContainer
      data-test={dataTest}
      onClick={onEdit}
      displayType={displayType}
      readOnly={readOnly}
      fluidWidth={fluidWidth}
    >
      <SelectPreview
        readOnly={readOnly}
        readOnlyMessage={readOnlyMessage}
        sx={{ height: '100%' }}
        wrapColumn={wrapColumn}
        value={selectValue}
        options={selectOptions}
        size='small'
        emptyMessage={emptyMessage}
        showEmpty={showEmpty || displayType === 'details'}
      />
    </SelectPreviewContainer>
  );

  if (showInsidePopup) {
    return <PopupFieldWrapper previewField={previewField} activeField={activeField} disabled={readOnly} />;
  }

  if (!isOpened) {
    return previewField;
  }

  return activeField;
}
