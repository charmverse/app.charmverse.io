import { Person } from '@mui/icons-material';
import { Stack, Typography } from '@mui/material';
import type { BoxProps } from '@mui/material/Box';
import Box from '@mui/material/Box';
import Link from 'next/link';
import type { ReactNode } from 'react';

export function PageWrapper({
  children,
  backToProfileHeader,
  ...restProps
}: BoxProps & { backToProfileHeader?: boolean; children: ReactNode }) {
  return (
    <Box
      p={backToProfileHeader ? 0 : 3}
      pb={4}
      borderRadius={8}
      bgcolor='background.default'
      border={{ xs: 'none', md: '1px solid var(--charm-palette-divider)' }}
      maxWidth='500px'
      mx='auto'
      my={2}
      position={backToProfileHeader ? 'relative' : undefined}
      {...restProps}
    >
      {backToProfileHeader && (
        <Box
          sx={{
            top: 0,
            p: 2,
            width: '499px',
            borderRight: {
              xs: 'none',
              md: '1px solid var(--charm-palette-divider)'
            },
            backgroundColor: 'white',
            zIndex: 1,
            position: 'fixed'
          }}
        >
          <Stack sx={{ cursor: 'pointer', flexDirection: 'row', gap: 0.5, alignItems: 'center', width: 'fit-content' }}>
            <Person fontSize='small' />
            <Link href='/profile' passHref>
              <Typography>Back to profile</Typography>
            </Link>
          </Stack>
        </Box>
      )}
      {children}
    </Box>
  );
}
