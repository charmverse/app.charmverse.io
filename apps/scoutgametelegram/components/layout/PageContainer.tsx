import { Box } from '@mui/material';

import { InfoBackgroundImage } from 'components/layout/InfoBackgroundImage';

export function PageContainer({ children }: { children: React.ReactNode }) {
  return (
    <Box sx={{ minHeight: 'calc(100vh + 100px)', position: 'relative' }}>
      <InfoBackgroundImage />
      {children}
    </Box>
  );
}
