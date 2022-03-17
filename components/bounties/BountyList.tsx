import { Button, Grid, Typography } from '@mui/material';
import { BountyStatus } from '@prisma/client';
import BountyModal from 'components/bounties/BountyModal';
import { BountiesContext } from 'hooks/useBounties';
import { useContext, useState } from 'react';
import { sortArrayByObjectProperty } from 'lib/utilities/array';
import { BountyCard } from './BountyCard';
import MultiPaymentModal from './MultiPaymentModal';

const safeAddress = '0xE7faB335A404a09ACcE83Ae5F08723d8e5c69b58';

const bountyOrder: BountyStatus[] = ['open', 'assigned', 'review', 'complete'];

export function BountyList () {
  const [displayBountyDialog, setDisplayBountyDialog] = useState(false);
  const { bounties, setBounties } = useContext(BountiesContext);

  let sortedBounties = bounties ? sortArrayByObjectProperty(bounties.slice(), 'status', bountyOrder) : [];
  sortedBounties = sortedBounties.filter(bounty => {
    return bounty.status !== 'paid';
  });

  function bountyCreated () {
    setDisplayBountyDialog(false);
  }

  return (
    <Grid container>

      <Grid item container xs alignItems='center' mb={3}>

        {
          /**
           * Remove later to its own popup modal
           */
          displayBountyDialog === true && (
            <BountyModal
              onSubmit={bountyCreated}
              open={displayBountyDialog}
              onClose={() => {
                setDisplayBountyDialog(false);
              }}
            />
          )
        }

        <Grid item xs={8}>
          <Typography variant='h1'>Bounty list</Typography>
        </Grid>

        <Grid item xs={4} container justifyContent='flex-end'>
          <MultiPaymentModal />
          <Button
            sx={{ ml: 1 }}
            variant='outlined'
            onClick={() => {
              setDisplayBountyDialog(true);
            }}
          >
            Create Bounty
          </Button>
        </Grid>

      </Grid>

      <Grid container sx={{ maxHeight: '80vh', overflowY: 'auto' }}>
        {
          bounties.length === 0
            ? <Typography paragraph={true}>No bounties were found</Typography>
            : sortedBounties.map(bounty => {
              return <BountyCard truncate={false} key={bounty.id} bounty={bounty} />;
            })
        }
      </Grid>
    </Grid>
  );
}
