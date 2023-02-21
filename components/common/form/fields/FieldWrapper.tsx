import Box from '@mui/material/Box';
import type { ReactNode } from 'react';

import FieldLabel from '../FieldLabel';

type Props = {
  children: ReactNode;
  label?: string;
  inline?: boolean;
  iconLabel?: ReactNode;
};

export function FieldWrapper({ children, label, inline, iconLabel }: Props) {
  if (!label) {
    return children as JSX.Element;
  }

  return (
    <Box flex={1} flexDirection={{ xs: 'column', sm: inline ? 'row' : 'column' }} display='flex' gap={1} my={1}>
      {(label || !!iconLabel) && (
        <Box alignItems='center' display='flex' gap={1}>
          {iconLabel ?? null}
          {label && <FieldLabel noWrap>{label}</FieldLabel>}
        </Box>
      )}
      {children}
    </Box>
  );
}
