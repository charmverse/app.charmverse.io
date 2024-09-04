'use client';

import { Button } from '@mui/material';
import { getGithubOAuthCallbackUrl } from '@root/lib/github/oauth';

// Using default export so we can use dynamic import of default export
export default function JoinGithubButton() {
  return (
    <Button
      href={getGithubOAuthCallbackUrl({
        redirect: `${window?.location.origin}/api/connect/github`
      })}
      variant='contained'
      color='primary'
    >
      Connect & Sign up
    </Button>
  );
}
