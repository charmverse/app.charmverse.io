import CloseIcon from '@mui/icons-material/CloseOutlined';
import { IconButton, InputAdornment } from '@mui/material';
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
    const dateValue =
      typeof value === 'string' || typeof value === 'number' ? DateTime.fromJSDate(new Date(value)) : undefined;

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
          value={dateValue}
          onChange={(_value) => {
            onChange?.(_value?.toJSDate().getTime());
          }}
          disabled={disabled}
          renderInput={(props) => {
            return (
              <TextField
                {...props}
                fullWidth
                inputProps={{
                  ...props.inputProps,
                  readOnly: true,
                  placeholder,
                  value: props.inputProps?.value ?? ''
                }}
                disabled={disabled}
                error={!!error}
                ref={ref}
                helperText={helperText}
              />
            );
          }}
        />
      </FieldWrapper>
    );
  }
);
