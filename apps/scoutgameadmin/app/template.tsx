import { Box } from '@mui/material';
import type { ReactNode } from 'react';

export default function Template({ children }: { children: ReactNode }) {
  return <Box mt={3}>{children}</Box>;
}
