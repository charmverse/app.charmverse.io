import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { Bounty } from '@prisma/client';
import { useBounties } from 'hooks/useBounties';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useRouter } from 'next/router';

interface Props {
  bounty: Bounty
  onDelete: () => void
  onCancel: () => void
}

export default function BountyDelete ({ bounty, onCancel, onDelete }: Props) {

  const { deleteBounty, currentBountyId, currentBounty } = useBounties();
  const router = useRouter();
  const [currentSpace] = useCurrentSpace();

  async function completeBountyDeletion () {

    await deleteBounty(bounty.id);

    if (currentBountyId === bounty.id || currentBounty?.id === bounty.id) {
      router.push(`/${currentSpace?.domain}/bounties`);
    }
  }

  return (
    <Box>

      {
        (bounty.status === 'inProgress') && (
        <Typography sx={{ mb: 1 }}>
          This bounty is in progress.
        </Typography>
        )
      }

      {
        (bounty.status === 'complete') && (
        <Typography sx={{ mb: 1 }}>
          Work on this bounty is awaiting payment.
        </Typography>
        )
      }

      {
        bounty.status !== 'suggestion' && (
        <Typography sx={{ mb: 1 }}>
          Are you sure you want to delete this bounty?
        </Typography>
        )
      }

      {
        bounty.status === 'suggestion' && (
        <Typography sx={{ mb: 1 }}>
          Are you sure you want to reject this suggestion?
        </Typography>
        )
      }

      <Box component='div' sx={{ columnSpacing: 2, mt: 3 }}>
        <Button
          color='error'
          sx={{ mr: 2, fontWeight: 'bold' }}
          onClick={completeBountyDeletion}
        >Delete bounty {bounty.status === 'suggestion' ? 'suggestion' : ''}
        </Button>

        <Button color='secondary' onClick={onCancel}>Cancel</Button>
      </Box>
    </Box>
  );
}
