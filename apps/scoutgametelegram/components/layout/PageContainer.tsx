import { Box } from '@mui/material';

import { Header } from 'components/common/Header';
import { InfoBackgroundImage } from 'components/layout/InfoBackgroundImage';

export function PageContainer({ children }: { children: React.ReactNode }) {
  return (
    <Box sx={{ minHeight: 'calc(100vh + 120px)', position: 'relative', overflow: 'auto' }}>
      <Header />
      <InfoBackgroundImage />
      {children}
    </Box>
  );
}
