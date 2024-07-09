'use client';

import { actionPublishProjectToGitcoin } from '@connect/lib/actions/publishProjectToGitcoin';
import { Alert, Button, Card, CardContent, Stack, Typography } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useAction } from 'next-safe-action/hooks';
import { useState } from 'react';

export function PublishProjectToGitcoin({ projectPath }: { projectPath: string }) {
  const router = useRouter();

  const [error, setError] = useState<string | null>(null);

  // @ts-ignore
  const { execute, isExecuting } = useAction(actionPublishProjectToGitcoin, {
    onSuccess: (data) => {
      router.push(`/p/${projectPath}`);
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
              execute({ projectPath });
            }}
            disabled={isExecuting}
            sx={{ width: 'fit-content', minWidth: '120px' }}
          >
            {isExecuting ? 'Publishing' : 'Submit'}
          </Button>
          {error && <Alert severity='error'>{error}</Alert>}

          <Typography variant='caption'>OR </Typography>

          <Button
            href={`/p/${projectPath}`}
            variant='outlined'
            color='secondary'
            disabled={isExecuting}
            data-test='project-skip-gitcoin-attestation'
            sx={{ width: 'fit-content', minWidth: '120px' }}
          >
            View project
          </Button>
        </CardContent>
      </Card>
    </Stack>
  );
}
