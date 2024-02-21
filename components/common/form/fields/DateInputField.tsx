import TextField from '@mui/material/TextField';
import { DateTimePicker } from '@mui/x-date-pickers';
import { DateTime } from 'luxon';
import { forwardRef } from 'react';

import { FieldWrapper } from 'components/common/form/fields/FieldWrapper';
import type { ControlFieldProps, FieldProps } from 'components/common/form/interfaces';

type Props = ControlFieldProps & FieldProps;

export const DateInputField = forwardRef<HTMLDivElement, Props>(
  (
    {
      label,
      labelEndAdornment,
      inputEndAdornment,
      description,
      iconLabel,
      inline,
      required,
      onChange,
      value,
      error,
      helperText,
      disabled,
      placeholder
    },
    ref
  ) => {
    // Convert to luxon date
    const dateValue =
      typeof value === 'string' || typeof value === 'number' ? DateTime.fromJSDate(new Date(value)) : undefined;

    return (
      <FieldWrapper
        labelEndAdornment={labelEndAdornment}
        description={description}
        required={required}
        label={label}
        inline={inline}
        iconLabel={iconLabel}
        inputEndAdornment={inputEndAdornment}
      >
        <DateTimePicker
          value={dateValue}
          onChange={(_value) => {
            // Convert to unix timestamp
            onChange?.(_value?.toJSDate().getTime());
          }}
          disabled={disabled}
          slotProps={{
            textField: {
              fullWidth: true,
              inputProps: {
                readOnly: true,
                placeholder
                // props.inputProps.value is always a date, either dateValue or current date
                // value: dateValue ? props.inputProps?.value : undefined
              },
              disabled,
              error: !!error,
              ref,
              helperText
            }
          }}
        />
      </FieldWrapper>
    );
  }
);
