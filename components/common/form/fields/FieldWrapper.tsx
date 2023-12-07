import { Typography } from '@mui/material';
import Box from '@mui/material/Box';
import type { ReactNode } from 'react';

import FieldLabel from '../FieldLabel';

type Props = {
  children: ReactNode;
  label?: string;
  inline?: boolean;
  iconLabel?: ReactNode;
  required?: boolean;
};

export function FieldWrapper({ required, children, label, inline, iconLabel }: Props) {
  if (!label) {
    return children as JSX.Element;
  }

  return (
    <Box flex={1} flexDirection={{ xs: 'column', sm: inline ? 'row' : 'column' }} display='flex' my={1}>
      {(label || !!iconLabel) && (
        <Box alignItems='center' display='flex' gap={1}>
          {iconLabel ?? null}
          {label && (
            <FieldLabel noWrap>
              {label}
              {required && (
                <Typography component='span' color='error'>
                  *
                </Typography>
              )}
            </FieldLabel>
          )}
        </Box>
      )}
      {children}
    </Box>
  );
}
