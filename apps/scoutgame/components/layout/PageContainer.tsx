import { Container } from '@mui/material';
import type { PropsWithChildren } from '@packages/utils/types';

export function PageContainer({ children }: PropsWithChildren) {
  return (
    <Container maxWidth='lg' sx={{ py: 1 }}>
      {children}
    </Container>
  );
}
