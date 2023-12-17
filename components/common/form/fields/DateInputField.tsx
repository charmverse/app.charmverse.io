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
      endAdornment,
      description,
      iconLabel,
      inline,
      required,
      onChange,
      value,
      error,
      helperText,
      disabled,
      placeholder,
      fieldWrapperSx
    },
    ref
  ) => {
    return (
      <FieldWrapper
        endAdornment={endAdornment}
        description={description}
        required={required}
        label={label}
        inline={inline}
        iconLabel={iconLabel}
        sx={fieldWrapperSx}
      >
        <DateTimePicker
          value={value ? DateTime.fromJSDate(new Date(value)) : undefined}
          onChange={(_value) => {
            onChange?.(_value?.toJSDate().getTime());
          }}
          disabled={disabled}
          renderInput={(props) => (
            <TextField
              placeholder={placeholder}
              fullWidth
              disabled={disabled}
              error={!!error}
              ref={ref}
              helperText={helperText}
              {...props}
            />
          )}
        />
      </FieldWrapper>
    );
  }
);
