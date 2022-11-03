import { Chip, TextField } from '@mui/material';
import Autocomplete, { createFilterOptions } from '@mui/material/Autocomplete';
import { forwardRef } from 'react';

import { FieldWrapper } from 'components/common/form/fields/FieldWrapper';
import type { SelectOptionType } from 'components/common/form/fields/Select/interfaces';
import { SelectOptionItem } from 'components/common/form/fields/Select/SelectOptionItem';
import type { ControlFieldProps, FieldProps } from 'components/common/form/interfaces';

const filter = createFilterOptions<SelectOptionType>();

type SelectProps = {
  multiselect?: boolean;
  options?: SelectOptionType[];
  disabled?: boolean;
  onChange: (option: string | string[]) => void;
}

type Props = ControlFieldProps & FieldProps & SelectProps;

export const SelectField = forwardRef<HTMLDivElement, Props>((
  {
    label, iconLabel, inline, disabled, multiselect = false, options = [], ...inputProps },
  ref
) => {
  const selectedValues: string[] = Array.isArray(inputProps.value) ? inputProps.value : [inputProps.value];
  const selectedOptions = options.filter(option => option.id && selectedValues.includes(option.id));

  function onValueChange (updatedSelectedOptions: SelectOptionType[]) {
    const values = updatedSelectedOptions.map(option => option.id).filter(Boolean) as string[];
    const newValue = multiselect ? values : values.pop();
    inputProps.onChange(newValue || '');
  }
  return (
    <FieldWrapper label={label} inline={inline} iconLabel={iconLabel}>
      <Autocomplete
        ref={ref}
        disabled={disabled}
        disableCloseOnSelect={multiselect}
        value={selectedOptions}
        selectOnFocus
        clearOnBlur
        handleHomeEndKeys
        multiple
        filterSelectedOptions
        sx={{ minWidth: 150, width: '100%' }}
        options={options}
        autoHighlight
        clearIcon={null}
        renderOption={(selectProps, option) => (
          <SelectOptionItem key={option.id || option.name} option={option} menuItemProps={selectProps} />
        )}
        renderTags={(value, getTagProps) => value.map((option, index) => (
          // eslint-disable-next-line react/jsx-key
          <Chip
            {...getTagProps({ index })}
            size='small'
            label={option.name}
            color={option.color}
          />
        ))}
        noOptionsText='No options available'
        renderInput={(params) => (
          <TextField
            {...params}
            size='small'
          />
        )}
        getOptionLabel={(option: SelectOptionType) => {
          // Add "xxx" option created dynamically
          if ('inputValue' in option) {
            return option.inputValue;
          }
          // Regular option
          return option.name;
        }}
        filterOptions={(allOptions: SelectOptionType[], params) => {
          const filtered = filter(allOptions, params);

          const { inputValue } = params;
          // TODO - creatin new option from select
          // Suggest the creation of a new value
          // const isExisting = options.some((option) => inputValue === option.title);
          // if (inputValue !== '' && !isExisting && canEditCategories && onAddCategory) {
          //   filtered.push({
          //     inputValue,
          //     name: `Add "${inputValue}"`,
          //     color: getRandomThemeColor()
          //   });
          // }

          return filtered;
        }}
        isOptionEqualToValue={(option, checkValue) => {
          if ('inputValue' in option) {
            return 'inputValue' in checkValue && option.inputValue === checkValue.inputValue;
          }

          if ('id' in option) {
            return 'id' in checkValue && option.id === checkValue.id;
          }

          return false;
        }}
        onChange={(_, values) => {
          onValueChange(values);
        }}
      />
    </FieldWrapper>
  );
});
