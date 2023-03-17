import styled from '@emotion/styled';
import { Stack, Typography } from '@mui/material';
import { useCallback, useMemo, useState } from 'react';

import {
  mapPropertyOptionToSelectOption,
  mapSelectOptionToPropertyOption
} from 'components/common/BoardEditor/components/properties/SelectProperty/mappers';
import type { PropertyValueDisplayType } from 'components/common/BoardEditor/interfaces';
import type { SelectOptionType } from 'components/common/form/fields/Select/interfaces';
import { SelectPreview } from 'components/common/form/fields/Select/SelectPreview';
import { SelectField } from 'components/common/form/fields/SelectField';
import { isEmptyValue } from 'components/common/form/fields/utils';
import type { IPropertyOption } from 'lib/focalboard/board';

type ContainerProps = {
  displayType?: PropertyValueDisplayType;
};
const SelectPreviewContainer = styled(Stack, {
  shouldForwardProp: (prop: string) => prop !== 'displayType'
})<ContainerProps>`
  justify-content: center;

  border-radius: ${({ theme }) => theme.spacing(0.5)};
  transition: background-color 0.2s ease-in-out;

  padding: ${({ theme }) => theme.spacing(0.25, 0)};

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

  // disable hover UX on ios which converts first click to a hover event
  @media (pointer: fine) {
    &:hover {
      cursor: pointer;
      background-color: ${({ theme, displayType }) =>
        displayType === 'details' ? theme.palette.action.hover : 'transparent'};
    }
  }

  div {
    pointer-events: none;
  }

  width: 100%;
  height: 100%;
`;

const StyledSelect = styled(SelectField)<ContainerProps>`
  .MuiInputBase-root {
    background-color: ${({ theme }) => theme.palette.background.paper};

    .MuiAutocomplete-input {
      ${({ displayType, theme }) =>
        displayType === 'table'
          ? `
      width: 100%;
      border-top: 1px solid ${theme.palette.divider};
    `
          : ''}
    }
  }

  .MuiOutlinedInput-root.MuiInputBase-sizeSmall {
    padding: 1px;
  }
`;

type Props = {
  readOnly?: boolean;
  multiselect?: boolean;
  options: IPropertyOption[];
  propertyValue: string | string[];
  placeholder?: string;
  displayType?: PropertyValueDisplayType;
  onChange: (option: string | string[]) => void;
  onCreateOption?: (option: IPropertyOption) => void;
  onUpdateOption?: (option: IPropertyOption) => void;
  onDeleteOption?: (option: IPropertyOption) => void;
};

export function SelectProperty({
  readOnly,
  options,
  propertyValue,
  placeholder,
  multiselect = false,
  onChange,
  onUpdateOption,
  onDeleteOption,
  onCreateOption,
  displayType
}: Props) {
  const [isOpened, setIsOpened] = useState(false);

  const onEdit = useCallback(() => {
    if (!readOnly) {
      setIsOpened(true);
    }
  }, [readOnly]);

  const selectOptions = useMemo(() => {
    return options.map((o) => mapPropertyOptionToSelectOption(o));
  }, [options]);

  const selectValue = useMemo(() => {
    if (multiselect) {
      return typeof propertyValue === 'string' ? [propertyValue] : propertyValue;
    } else {
      return Array.isArray(propertyValue) ? propertyValue[0] || '' : propertyValue;
    }
  }, [multiselect, propertyValue]);

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

  if (!isOpened) {
    return (
      <SelectPreviewContainer onClick={onEdit} displayType={displayType}>
        <SelectPreview
          value={selectValue}
          options={selectOptions}
          size='small'
          emptyComponent={
            displayType === 'details' && (
              <Typography component='span' variant='subtitle2' sx={{ opacity: 0.4, pl: '2px' }}>
                Empty
              </Typography>
            )
          }
        />
      </SelectPreviewContainer>
    );
  }

  return (
    <StyledSelect
      placeholder={placeholder}
      autoOpen
      multiselect={multiselect}
      disabled={readOnly}
      value={selectValue}
      options={selectOptions}
      onChange={onChange}
      onUpdateOption={onUpdate}
      onDeleteOption={onDelete}
      onCreateOption={onCreate}
      onBlur={() => setIsOpened(false)}
      forcePopupIcon={false}
      displayType={displayType}
    />
  );
}
