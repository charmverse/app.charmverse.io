import type { SxProps, Theme } from '@mui/material';
import { TextField } from '@mui/material';
import { forwardRef } from 'react';

import { FieldWrapper } from 'components/common/form/fields/FieldWrapper';
import type { ControlFieldProps, FieldProps } from 'components/common/form/interfaces';

type Props = ControlFieldProps & FieldProps & { disableArrows?: boolean };

const disabledArrows: SxProps<Theme> = {
  '& input[type=number]::-webkit-outer-spin-button, & input[type=number]::-webkit-inner-spin-button': {
    WebkitAppearance: 'none',
    margin: 0
  },
  '& input[type=number]': {
    MozAppearance: 'textfield',
    coco: '2'
  }
};

export const NumberInputField = forwardRef<HTMLDivElement, Props>(
  (
    {
      label,
      labelEndAdornment,
      iconLabel,
      description,
      inline,
      error,
      required,
      placeholder,
      disableArrows = false,
      inputEndAdornment,
      ...inputProps
    }: Props,
    ref
  ) => {
    return (
      <FieldWrapper
        inputEndAdornment={inputEndAdornment}
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
          sx={{ ...(disableArrows ? disabledArrows : {}) }}
          {...inputProps}
          ref={ref}
          type='number'
        />
      </FieldWrapper>
    );
  }
);
