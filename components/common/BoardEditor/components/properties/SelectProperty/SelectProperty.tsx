import { useCallback, useMemo, useState } from 'react';

import { mapPropertyOptionToSelectOption, mapSelectOptionToPropertyOption } from 'components/common/BoardEditor/components/properties/SelectProperty/mappers';
import type { SelectOptionType } from 'components/common/form/fields/Select/interfaces';
import { SelectField } from 'components/common/form/fields/SelectField';
import type { IPropertyOption } from 'lib/focalboard/board';

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

  const selectOptions = useMemo(() => {
    return options.map(o => mapPropertyOptionToSelectOption(o));
  }, [options]);

  const selectValue = useMemo(() => {
    if (multiselect) {
      return typeof propertyValue === 'string' ? [propertyValue] : propertyValue;
    }
    else {
      return typeof propertyValue === 'string' ? propertyValue : propertyValue[0] || '';
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
    // return placeholder component
  }

  return (
    <SelectField
      multiselect={multiselect}
      disabled={readOnly}
      value={selectValue}
      options={selectOptions}
      onChange={onChange}
      onUpdateOption={onUpdate}
      onDeleteOption={onDelete}
      onCreateOption={onCreate}
    />
  );
}
