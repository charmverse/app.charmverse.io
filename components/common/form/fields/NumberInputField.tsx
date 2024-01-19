import { TextField } from '@mui/material';
import { forwardRef } from 'react';

import { FieldWrapper } from 'components/common/form/fields/FieldWrapper';
import type { ControlFieldProps, FieldProps } from 'components/common/form/interfaces';

type Props = ControlFieldProps & FieldProps & { disableArrows?: boolean };

const disabledArrows = {
  '& input[type=number]': {
    '-moz-appearance': 'textfield'
  },
  '& input[type=number]::-webkit-outer-spin-button': {
    '-webkit-appearance': 'none',
    margin: 0
  },
  '& input[type=number]::-webkit-inner-spin-button': {
    '-webkit-appearance': 'none',
    margin: 0
  }
};

export const NumberInputField = forwardRef<HTMLDivElement, Props>(
  (
    {
      label,
      endAdornment,
      iconLabel,
      description,
      inline,
      error,
      required,
      placeholder,
      disableArrows = false,
      ...inputProps
    }: Props,
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
      >
        <TextField
          fullWidth
          error={!!error}
          required={required}
          placeholder={placeholder}
          sx={{ ...(disableArrows ? disabledArrows : {}) }}
          {...inputProps}
          ref={ref}
          type='number'
        />
      </FieldWrapper>
    );
  }
);
