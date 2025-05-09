import { Button, Chip, MenuItem, TextField, Typography, Paper, Box } from '@mui/material';
import Autocomplete, { createFilterOptions } from '@mui/material/Autocomplete';
import type { SelectOptionType } from '@packages/lib/proposals/forms/interfaces';
import type { ReactNode } from 'react';
import { forwardRef, useEffect, useMemo, useRef, useState } from 'react';
import { v4 } from 'uuid';

import { FieldWrapper } from 'components/common/form/fields/FieldWrapper';
import { SelectOptionItem } from 'components/common/form/fields/Select/SelectOptionItem';
import type { ControlFieldProps, FieldProps } from 'components/common/form/interfaces';
import { getRandomThemeColor } from 'theme/utils/getRandomThemeColor';

const filter = createFilterOptions<SelectOptionType>();

type SelectProps = {
  value: string | string[];
  multiselect?: boolean;
  options?: SelectOptionType[];
  disabled?: boolean;
  includeSelectedOptions?: boolean;
  canEditOptions?: boolean;
  noOptionsText?: string;
  onChange?: (option: string | string[]) => void;
  onCreateOption?: (option: SelectOptionType) => void;
  onUpdateOption?: (option: SelectOptionType) => void;
  onDeleteOption?: (option: SelectOptionType) => void;
  onBlur?: () => void;
  autoOpen?: boolean;
  placeholder?: string;
  className?: string;
  forcePopupIcon?: boolean | 'auto';
  required?: boolean;
  fluidWidth?: boolean;
  'data-test'?: string;
  disablePopper?: boolean;
};

type Props = Omit<ControlFieldProps, 'value'> & FieldProps & SelectProps;

export const SelectField = forwardRef<HTMLDivElement, Props>(
  (
    {
      description,
      labelEndAdornment,
      inputEndAdornment,
      required,
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
      includeSelectedOptions = false,
      forcePopupIcon = 'auto',
      noOptionsText,
      helperText,
      fluidWidth,
      'data-test': dataTest,
      disablePopper,
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

      inputProps.onChange?.(newValue || '');
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
      <FieldWrapper
        labelEndAdornment={labelEndAdornment}
        description={description}
        label={label}
        required={required}
        inline={inline}
        iconLabel={iconLabel}
        inputEndAdornment={inputEndAdornment}
        error={!!inputProps.error}
      >
        <Autocomplete
          data-test={dataTest || 'autocomplete'}
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
          PopperComponent={disablePopper ? NoPopperComponent : undefined}
          filterSelectedOptions={!includeSelectedOptions}
          sx={!fluidWidth ? { minWidth: 150, width: '100%', zIndex: 1 } : { zIndex: 1 }}
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
              <Chip
                {...getTagProps({ index })}
                sx={{ px: 0.5 }}
                style={{ margin: 0, marginRight: 8, marginBottom: 2, marginTop: 2 }} // margin is added when dropdown is open for some reason, making the input height increase
                size='small'
                label={option.name}
                color={option.color}
              />
            ))
          }
          noOptionsText={<Typography variant='caption'>{noOptionsText || 'No options available'}</Typography>}
          renderInput={(params) => (
            <TextField
              inputRef={inputRef}
              {...params}
              size='small'
              placeholder={!selectedOptions.length ? placeholder : undefined}
              error={!!inputProps.error}
              helperText={helperText}
            />
          )}
          getOptionLabel={(option: SelectOptionType) => {
            return option?.name;
          }}
          filterOptions={(allOptions: SelectOptionType[], params) => {
            const filtered = filter(allOptions, params);

            const { inputValue } = params;

            // Suggest the creation of a new value
            const isExisting = options.some(
              (option) =>
                // Check exists in case a field has non string values but we ended up here (changing type of an incompatible property)
                typeof option.name === 'string' && inputValue.toLowerCase() === option.name?.toLocaleLowerCase()
            );
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

// We replace the Popper with a div when SelectField is inside another popup. See PopupFieldWrapper
function NoPopperComponent(props: any & { children: ReactNode }) {
  return <div>{props.children}</div>;
}
