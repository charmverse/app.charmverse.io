import { Button, Typography } from '@mui/material';
import { getGithubAppCallbackUrl } from '@root/lib/github/oauth';
import dynamic from 'next/dynamic';
import { Suspense } from 'react';

import { JoinGithubButton } from 'components/github/JoinGithubButton';

export default function BuildersPage() {
  return (
    <div>
      <Typography variant='h3'>Builders Page</Typography>
      <Suspense>
        <JoinGithubButton />
      </Suspense>
    </div>
  );
}
