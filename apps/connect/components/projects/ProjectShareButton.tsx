import ShareIcon from '@mui/icons-material/Share';
import { Button } from '@mui/material';
import Link from 'next/link';

export function ShareButton({ projectId }: { projectId: string }) {
  return (
    <Button
      LinkComponent={Link}
      href={`https://warpcast.com/~/compose?text=Checkout%20my%20new%20Project!&embeds[]=https://connect.charmverse.io/p/${projectId}`}
      target='_blank'
      rel='noopener noreferrer'
      disabled={!projectId}
      color='secondary'
      variant='outlined'
      startIcon={<ShareIcon fontSize='small' />}
    >
      Share
    </Button>
  );
}
