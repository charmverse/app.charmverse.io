import { FormLabel, Typography } from '@mui/material';
import type { ReactNode } from 'react';

export function FieldLabel({ required, children, style }: { required?: boolean; children?: ReactNode; style?: any }) {
  return (
    <FormLabel required={required} style={style}>
      <Typography component='span' variant='subtitle1'>
        {children}
      </Typography>
    </FormLabel>
  );
}
