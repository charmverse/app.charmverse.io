import { TextField } from '@mui/material';
import { forwardRef } from 'react';

import { FieldWrapper } from 'components/common/form/fields/FieldWrapper';
import type { ControlFieldProps, FieldProps } from 'components/common/form/interfaces';

type Props = ControlFieldProps & FieldProps & { multiline?: boolean, rows?: number };

export const TextInputField = forwardRef<HTMLDivElement, Props>(({ label, iconLabel, inline, error, multiline = false, ...inputProps }, ref) => {
  return (
    <FieldWrapper label={label} inline={inline} iconLabel={iconLabel}>
      <TextField fullWidth error={!!error} multiline={multiline} {...inputProps} ref={ref} />
    </FieldWrapper>
  );
});
