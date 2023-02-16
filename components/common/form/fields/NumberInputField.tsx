import { TextField } from '@mui/material';
import { forwardRef } from 'react';

import { FieldWrapper } from 'components/common/form/fields/FieldWrapper';
import type { ControlFieldProps, FieldProps } from 'components/common/form/interfaces';

type Props = ControlFieldProps & FieldProps;

export const NumberInputField = forwardRef<HTMLDivElement, Props>(
  ({ label, iconLabel, inline, error, onChange, customOnChange, ...inputProps }: Props, ref) => {
    const onChangeHandler = (event: React.ChangeEvent<HTMLInputElement>) => {
      onChange(event);
      customOnChange?.(event.target.value);
    };

    return (
      <FieldWrapper label={label} inline={inline} iconLabel={iconLabel}>
        <TextField fullWidth error={!!error} onChange={onChangeHandler} {...inputProps} ref={ref} type='number' />
      </FieldWrapper>
    );
  }
);
