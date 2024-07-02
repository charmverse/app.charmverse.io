'use client';

import { actionPublishProjectToGitcoin } from '@connect/lib/actions/publishProjectToGitcoin';
import { Alert, Button, Card, CardContent, Stack, Typography } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useAction } from 'next-safe-action/hooks';
import { useState } from 'react';

export function PublishProjectToGitcoin({ projectId }: { projectId: string }) {
  const router = useRouter();

  const [error, setError] = useState<string | null>(null);

  // @ts-ignore
  const { execute, isExecuting } = useAction(actionPublishProjectToGitcoin, {
    onSuccess: (data) => {
      router.push(`/p/${projectId}`);
    },
    onError(err: any) {
      setError(err.message ?? 'Failed to publish project to Gitcoin');
    }
  });

  return (
    <Stack gap={3}>
      <Typography variant='body1' display='flex' justifyContent='center'>
        1 last step to join Onchain Summer
      </Typography>
      <Card sx={{ py: 2 }}>
        <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <Typography>Submit your project to Gitcoin</Typography>
          <Button
            onClick={() => {
              setError(null);
              execute({ projectId });
            }}
            disabled={isExecuting}
            sx={{ width: 'fit-content' }}
          >
            {isExecuting ? 'Publishing to Gitcoin' : 'Submit'}
          </Button>
          {error && <Alert severity='error'>{error}</Alert>}
        </CardContent>
      </Card>
    </Stack>
  );
}
