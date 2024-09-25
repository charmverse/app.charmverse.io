'use client';

import { Button, Stack, Typography } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useAction } from 'next-safe-action/hooks';

import { saveOnboardedAction } from 'lib/users/saveOnboardedAction';

export function SkipBuilderStepButton() {
  const router = useRouter();
  const { executeAsync, isExecuting } = useAction(saveOnboardedAction, {
    onSuccess: () => {
      router.push('/welcome/spam-policy');
    }
  });

  return (
    <Stack direction='row' justifyContent='center'>
      <Button variant='text' onClick={() => executeAsync()} disabled={isExecuting} data-test='skip-builder-step-button'>
        <Typography color='primary'>Skip for now</Typography>
      </Button>
    </Stack>
  );
}
