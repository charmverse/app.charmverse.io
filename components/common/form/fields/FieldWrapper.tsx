import { Typography } from '@mui/material';
import { Box } from '@mui/system';
import type { ReactNode } from 'react';

type Props = {
  children: ReactNode;
  label?: string;
  inline?: boolean;
  iconLabel?: ReactNode;
};

export function FieldWrapper ({ children, label, inline, iconLabel }: Props): JSX.Element {
  return (
    <Box flex={1} flexDirection={{ xs: 'column', sm: inline ? 'row' : 'column' }} display='flex' gap={1} my={1}>
      {(label || !!iconLabel) && (
        <Box maxWidth={150} width={150} alignItems='center' display='flex' gap={1}>
          {iconLabel ?? null}
          {label && (
            <Typography
              sx={{
                wordBreak: 'break-word'
              }}
              variant='subtitle2'
              fontWeight='bold'
            >{label}
            </Typography>
          )}
        </Box>
      )}
      {children}
    </Box>
  );
}
