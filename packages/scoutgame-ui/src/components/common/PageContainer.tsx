import { Container } from '@mui/material';
import type { PropsWithChildren } from '@packages/utils/react';

// For Home, Scout, Notifications, etc.
export function PageContainer({ children }: PropsWithChildren) {
  return (
    <Container maxWidth='lg' sx={{ p: 1 }}>
      {children}
    </Container>
  );
}
