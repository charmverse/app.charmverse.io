import { TextField } from '@mui/material';
import { forwardRef } from 'react';

import { FieldWrapper } from 'components/common/form/fields/FieldWrapper';
import type { ControlFieldProps, FieldProps } from 'components/common/form/interfaces';

type Props = ControlFieldProps & FieldProps;

export const NumberInputField = forwardRef<HTMLDivElement, Props>(
  (
    { label, labelEndAdornment, iconLabel, description, inline, error, required, placeholder, ...inputProps }: Props,
    ref
  ) => {
    return (
      <FieldWrapper
        labelEndAdornment={labelEndAdornment}
        description={description}
        required={required}
        label={label}
        inline={inline}
        iconLabel={iconLabel}
      >
        <TextField
          fullWidth
          error={!!error}
          required={required}
          placeholder={placeholder}
          {...inputProps}
          ref={ref}
          type='number'
        />
      </FieldWrapper>
    );
  }
);
