'use client';

import { LoadingComponent } from '@connect/components/common/LoadingComponent';
import { useS3UploadInput } from '@connect/hooks/useS3UploadInput';
import { actionPublishProjectToGitcoin } from '@connect/lib/actions/publishProjectToGitcoin';
import { Button, Card, CardContent, Stack, Typography, Box } from '@mui/material';
import { useAction } from 'next-safe-action/hooks';

export function PublishProjectToGitcoin({ projectId }: { projectId: string }) {
  // @ts-ignore
  const { execute, isExecuting } = useAction(actionPublishProjectToGitcoin, {
    onSuccess: (data) => {
      console.log(data);
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
          <Button
            endIcon={
              <Box height='12px'>
                <LoadingComponent isLoading size={2} minHeight='2px' />
              </Box>
            }
            onClick={() => execute({ projectId })}
            disabled={isExecuting}
            sx={{ width: 'fit-content' }}
          >
            Submit
          </Button>
        </CardContent>
      </Card>
    </Stack>
  );
}
