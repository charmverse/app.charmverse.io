'use client';

import { LoadingComponent } from '@connect/components/common/LoadingComponent';
import { useS3UploadInput } from '@connect/hooks/useS3UploadInput';
import { actionPublishProjectToGitcoin } from '@connect/lib/actions/publishProjectToGitcoin';
import { Button, Card, CardContent, Stack, Typography, Box } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useAction } from 'next-safe-action/hooks';

export function PublishProjectToGitcoin({ projectId }: { projectId: string }) {
  const router = useRouter();
  // @ts-ignore
  const { execute, isExecuting } = useAction(actionPublishProjectToGitcoin, {
    onSuccess: (data) => {
      router.push(`/projects/${projectId}`);
    },
    onError(err) {
      console.log(err);
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
          <Button onClick={() => execute({ projectId })} disabled={isExecuting} sx={{ width: 'fit-content' }}>
            {isExecuting ? 'Publishing to Gitcoin' : 'Submit'}
          </Button>
        </CardContent>
      </Card>
    </Stack>
  );
}
