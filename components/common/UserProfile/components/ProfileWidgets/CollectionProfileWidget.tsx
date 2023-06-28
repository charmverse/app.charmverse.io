import { Card, CardContent, CardHeader, Divider, Typography } from '@mui/material';
import { Stack } from '@mui/system';

import { NftsList } from '../NftsList';
import { PoapsList } from '../PoapsList';

export function CollectionProfileWidget({ userId }: { userId: string }) {
  return (
    <Card>
      <CardHeader
        sx={{
          pb: 0
        }}
        title={
          <Typography variant='h6' fontWeight={700}>
            Collection
          </Typography>
        }
      />
      <CardContent
        sx={{
          pt: 1
        }}
      >
        <Divider
          sx={{
            mb: 1
          }}
        />
        <Stack spacing={2}>
          <NftsList userId={userId} readOnly />
          <PoapsList userId={userId} />
        </Stack>
      </CardContent>
    </Card>
  );
}
