import TextField from '@mui/material/TextField';
import { DateTimePicker } from '@mui/x-date-pickers';
import { forwardRef } from 'react';

import { FieldWrapper } from 'components/common/form/fields/FieldWrapper';
import type { ControlFieldProps, FieldProps } from 'components/common/form/interfaces';

type Props = ControlFieldProps & FieldProps;

export const DateInputField = forwardRef<HTMLDivElement, Props>(
  (
    { label, description, iconLabel, inline, required, onChange, value, error, helperText, disabled, placeholder },
    ref
  ) => {
    return (
      <FieldWrapper description={description} required={required} label={label} inline={inline} iconLabel={iconLabel}>
        <DateTimePicker
          value={value}
          onChange={(_value) => onChange?.(_value)}
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
