import { Chip, MenuItem, TextField } from '@mui/material';
import Autocomplete, { createFilterOptions } from '@mui/material/Autocomplete';
import { forwardRef, useEffect, useRef, useState } from 'react';
import { v4 } from 'uuid';

import { FieldWrapper } from 'components/common/form/fields/FieldWrapper';
import type { SelectOptionType } from 'components/common/form/fields/Select/interfaces';
import { SelectOptionItem } from 'components/common/form/fields/Select/SelectOptionItem';
import type { ControlFieldProps, FieldProps } from 'components/common/form/interfaces';
import { getRandomThemeColor } from 'theme/utils/getRandomThemeColor';

const filter = createFilterOptions<SelectOptionType>();

type SelectProps = {
  value: string | string[];
  multiselect?: boolean;
  options?: SelectOptionType[];
  disabled?: boolean;
  canEditOptions?: boolean;
  onChange: (option: string | string[]) => void;
  onCreateOption?: (option: SelectOptionType) => void;
  onUpdateOption?: (option: SelectOptionType) => void;
  onDeleteOption?: (option: SelectOptionType) => void;
  onBlur?: () => void;
  autoOpen?: boolean;
  placeholder?: string;
  className?: string;
  forcePopupIcon?: boolean | 'auto';
};

type Props = Omit<ControlFieldProps, 'value'> & FieldProps & SelectProps;

export const SelectField = forwardRef<HTMLDivElement, Props>(
  (
    {
      label,
      iconLabel,
      inline,
      disabled,
      autoOpen = false,
      multiselect = false,
      canEditOptions = true,
      options = [],
      onDeleteOption,
      onUpdateOption,
      onCreateOption,
      onBlur,
      placeholder,
      className,
      forcePopupIcon = 'auto',
      ...inputProps
    },
    ref
  ) => {
    const selectedValues: string[] = Array.isArray(inputProps.value) ? inputProps.value : [inputProps.value];
    const selectedOptions = options.filter((option) => option.id && selectedValues.includes(option.id));
    const [isOptionEditOpened, setIsOptionEditOpened] = useState(false);
    const [isOpened, setIsOpened] = useState(false);
    const focusScheduledRef = useRef(autoOpen);

    const inputRef = useRef<HTMLInputElement>();

    function toggleOptionEdit(opened: boolean) {
      if (!opened) {
        // schedule refocus autocomplete input after option edit is closed
        focusScheduledRef.current = true;
      }

      setIsOptionEditOpened(opened);
      setIsOpened(true);
    }

    function onValueChange(updatedSelectedOptions: SelectOptionType[]) {
      const values = updatedSelectedOptions.map((option) => option.id).filter(Boolean) as string[];
      const tempValueOption = updatedSelectedOptions.find((option) => option.temp);
      const newValue = multiselect ? values : values.pop();

      if (tempValueOption && onCreateOption) {
        delete tempValueOption.temp;
        onCreateOption(tempValueOption);
      }

      inputProps.onChange(newValue || '');
    }

    useEffect(() => {
      if (focusScheduledRef.current) {
        inputRef.current?.focus();
        setIsOpened(true);
      }
    });

    useEffect(() => {
      if (isOpened) {
        focusScheduledRef.current = false;
      }
    }, [isOpened]);

    useEffect(() => {
      if (!isOpened && !isOptionEditOpened && !focusScheduledRef.current) {
        onBlur?.();
      }
    }, [isOpened, isOptionEditOpened]);

    return (
      <FieldWrapper label={label} inline={inline} iconLabel={iconLabel}>
        <Autocomplete
          className={className}
          onClose={() => setIsOpened(false)}
          onOpen={() => setIsOpened(true)}
          open={isOpened || isOptionEditOpened}
          ref={ref}
          disabled={disabled}
          disableCloseOnSelect={multiselect}
          value={selectedOptions}
          selectOnFocus
          clearOnBlur
          handleHomeEndKeys
          multiple
          filterSelectedOptions
          sx={{ minWidth: 150, width: '100%', zIndex: 1 }}
          options={options}
          autoHighlight
          clearIcon={null}
          forcePopupIcon={forcePopupIcon}
          renderOption={(selectProps, option) => {
            if (option.temp) {
              return <MenuItem {...selectProps}>Add {option.name}</MenuItem>;
            }

            return (
              <SelectOptionItem
                key={option.id || option.name}
                option={option}
                menuItemProps={selectProps}
                onDelete={canEditOptions ? onDeleteOption : undefined}
                onChange={canEditOptions ? onUpdateOption : undefined}
                onToggleOptionEdit={toggleOptionEdit}
              />
            );
          }}
          renderTags={(value, getTagProps) =>
            value.map((option, index) => (
              // eslint-disable-next-line react/jsx-key
              <Chip {...getTagProps({ index })} size='small' label={option.name} color={option.color} />
            ))
          }
          noOptionsText='No options available'
          renderInput={(params) => (
            <TextField
              inputRef={inputRef}
              {...params}
              size='small'
              placeholder={!selectedOptions.length ? placeholder : undefined}
            />
          )}
          getOptionLabel={(option: SelectOptionType) => {
            return option.name;
          }}
          filterOptions={(allOptions: SelectOptionType[], params) => {
            const filtered = filter(allOptions, params);

            const { inputValue } = params;

            // Suggest the creation of a new value
            const isExisting = options.some((option) => inputValue.toLowerCase() === option.name?.toLocaleLowerCase());
            if (inputValue !== '' && !isExisting && onCreateOption && canEditOptions) {
              filtered.push({
                temp: true,
                id: v4(),
                name: inputValue,
                color: getRandomThemeColor()
              });
            }

            return filtered;
          }}
          isOptionEqualToValue={(option, checkValue) => {
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
  }
);
