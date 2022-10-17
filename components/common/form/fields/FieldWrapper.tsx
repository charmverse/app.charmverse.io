import { Typography } from '@mui/material';
import { Box } from '@mui/system';
import type { ReactNode } from 'react';

type Props = {
  children: ReactNode;
  label?: string;
  inline?: boolean;
};

export function FieldWrapper ({ children, label, inline }: Props): JSX.Element {
  return (
    <Box flex={1} flexDirection={inline ? 'row' : 'column'} display='flex' gap={1} my={1}>
      {label && (
        <Box maxWidth={150} width={150} alignItems='center' display='flex'>
          <Typography variant='subtitle2' fontWeight='bold'>{label}</Typography>
        </Box>
      )}
      {children}
    </Box>
  );
}
