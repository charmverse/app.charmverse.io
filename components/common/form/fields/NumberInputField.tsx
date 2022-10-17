import { TextField } from '@mui/material';

import { FieldWrapper } from 'components/common/form/fields/FieldWrapper';
import type { ControlFieldProps, FieldProps } from 'components/common/form/interfaces';

type Props = ControlFieldProps & FieldProps;

export function NumberInputField ({ label, inline, error, ...inputProps }: Props) {
  return (
    <FieldWrapper label={label} inline={inline}>
      <TextField fullWidth error={!!error} {...inputProps} type='number' />
    </FieldWrapper>
  );
}
