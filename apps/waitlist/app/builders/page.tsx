import { Button, Typography } from '@mui/material';
import { getGithubAppCallbackUrl } from '@root/lib/github/oauth';
import dynamic from 'next/dynamic';

const JoinGithubButton = dynamic(() => import('components/github/JoinGithubButton'), { ssr: false });

export default function BuildersPage() {
  return (
    <div>
      <Typography variant='h3'>Builders Page</Typography>

      <JoinGithubButton />
    </div>
  );
}
