import { Box, Card, Divider, Typography } from '@mui/material';
import type { PropsWithChildren } from '@packages/utils/react';

export function InfoCard({ children, title }: PropsWithChildren<{ title?: string }>) {
  return (
    <Card
      variant='outlined'
      sx={{
        width: '100%',
        mx: 'auto',
        backgroundColor: {
          xs: 'transparent',
          md: 'var(--mui-palette-background-paper)'
        },
        borderColor: 'secondary.main',
        borderWidth: { xs: 0, md: 1 }
      }}
    >
      <Divider sx={{ borderColor: 'secondary.main', borderWidth: { xs: 1, md: 0 } }} />
      <Box display='flex' flexDirection='column' gap={2} my={2} py={2} px={{ md: 4 }}>
        {title && (
          <Typography variant='h5' fontWeight={600} textAlign='center' color='secondary'>
            {title}
          </Typography>
        )}
        {children}
      </Box>
    </Card>
  );
}
