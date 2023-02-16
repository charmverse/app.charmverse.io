import TextField from '@mui/material/TextField';
import { forwardRef } from 'react';

import { FieldWrapper } from 'components/common/form/fields/FieldWrapper';
import type { ControlFieldProps, FieldProps } from 'components/common/form/interfaces';

type Props = ControlFieldProps & FieldProps & { multiline?: boolean; rows?: number };

export const TextInputField = forwardRef<HTMLDivElement, Props>(
  ({ label, iconLabel, inline, error, multiline = false, customOnChange, onChange, ...inputProps }, ref) => {
    const onChangeHandler = (event: React.ChangeEvent<HTMLInputElement>) => {
      onChange(event);
      customOnChange?.(event.target.value);
    };

    return (
      <FieldWrapper label={label} inline={inline} iconLabel={iconLabel}>
        <TextField
          fullWidth
          error={!!error}
          multiline={multiline}
          onChange={onChangeHandler}
          {...inputProps}
          ref={ref}
        />
      </FieldWrapper>
    );
  }
);
