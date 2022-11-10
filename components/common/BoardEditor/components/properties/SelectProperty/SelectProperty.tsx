import styled from '@emotion/styled';
import { Stack, Typography } from '@mui/material';
import { useCallback, useMemo, useState } from 'react';

import { mapPropertyOptionToSelectOption, mapSelectOptionToPropertyOption } from 'components/common/BoardEditor/components/properties/SelectProperty/mappers';
import type { SelectOptionType } from 'components/common/form/fields/Select/interfaces';
import { SelectPreview } from 'components/common/form/fields/Select/SelectPreview';
import { SelectField } from 'components/common/form/fields/SelectField';
import type { IPropertyOption } from 'lib/focalboard/board';

type PreviewProps ={
  readOnly?: boolean;
}
const SelectPreviewContainer = styled(Stack)<PreviewProps>`
  min-height: 32px;
  min-width: 150px;
  justify-content: center;
  padding: ${({ theme }) => theme.spacing(0.5)};
  padding-right: ${({ theme }) => theme.spacing(2)};
  border-radius: ${({ theme }) => theme.spacing(0.5)};
  transition: background-color 0.2s ease-in-out;

  &:hover {
    cursor: pointer;
    background-color: ${({ theme, readOnly }) => !readOnly ? theme.palette.action.hover : 'transparent'};
  }

  div {
    pointer-events: none;
  }
`;

const StyledSelect = styled(SelectField)`
  .MuiInputBase-root {
    background: transparent;
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
  onChange: (option: string | string[]) => void;
  onCreateOption?: (option: IPropertyOption) => void;
  onUpdateOption?: (option: IPropertyOption) => void;
  onDeleteOption?: (option: IPropertyOption) => void;
};

export function SelectProperty ({
  readOnly,
  options,
  propertyValue,
  placeholder,
  multiselect = false,
  onChange,
  onUpdateOption,
  onDeleteOption,
  onCreateOption
}: Props) {
  const [isOpened, setIsOpened] = useState(false);

  const onEdit = useCallback(() => {
    if (!readOnly) {
      setIsOpened(true);
    }
  }, [readOnly]);

  const selectOptions = useMemo(() => {
    return options.map(o => mapPropertyOptionToSelectOption(o));
  }, [options]);

  const selectValue = useMemo(() => {
    if (multiselect) {
      return typeof propertyValue === 'string' ? [propertyValue] : propertyValue;
    }
    else {
      return Array.isArray(propertyValue) ? propertyValue[0] || '' : propertyValue;
    }
  }, [multiselect, propertyValue]);

  const onUpdate = useCallback((selectOption: SelectOptionType) => {
    const option = mapSelectOptionToPropertyOption(selectOption);
    onUpdateOption?.(option);
  }, [onUpdateOption]);

  const onDelete = useCallback((selectOption: SelectOptionType) => {
    const option = mapSelectOptionToPropertyOption(selectOption);
    onDeleteOption?.(option);
  }, [onDeleteOption]);

  const onCreate = useCallback((selectOption: SelectOptionType) => {
    const option = mapSelectOptionToPropertyOption(selectOption);
    onCreateOption?.(option);
  }, [onCreateOption]);

  if (!isOpened) {
    return (
      <SelectPreviewContainer onClick={onEdit} readOnly={readOnly}>
        <SelectPreview
          value={selectValue}
          options={selectOptions}
          size='small'
          emptyComponent={<Typography variant='subtitle2' sx={{ opacity: 0.4, pl: '2px', fontSize: '14px' }}>Empty</Typography>}
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
    />

  );
}
