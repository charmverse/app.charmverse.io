import { TextField } from '@mui/material';
import { forwardRef } from 'react';

import { FieldWrapper } from 'components/common/form/fields/FieldWrapper';
import type { ControlFieldProps, FieldProps } from 'components/common/form/interfaces';

type Props = ControlFieldProps & FieldProps;

export const NumberInputField = forwardRef<HTMLDivElement, Props>(
  ({ label, iconLabel, description, inline, error, required, ...inputProps }: Props, ref) => {
    return (
      <FieldWrapper description={description} required={required} label={label} inline={inline} iconLabel={iconLabel}>
        <TextField fullWidth error={!!error} required={required} {...inputProps} ref={ref} type='number' />
      </FieldWrapper>
    );
  }
);
