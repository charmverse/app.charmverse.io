import { Card, CardContent } from '@mui/material';
import type { PropsWithChildren } from '@packages/utils/react';

export function InfoCard({ children }: PropsWithChildren) {
  return (
    <Card variant='outlined' color='secondary' sx={{ width: '100%', mx: 'auto' }}>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
