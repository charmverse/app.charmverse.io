import { Button, Grid, Typography } from '@mui/material';
import { Bounty as IBounty } from '@prisma/client';
import BountyModal from 'components/bounties_v2/BountyModal';
import { BountiesContext } from 'hooks/useBounties';
import { useContext, useState } from 'react';
import { BountyCard } from './BountyCard';

export function BountyList () {
  const [displayBountyDialog, setDisplayBountyDialog] = useState(false);
  const { bounties } = useContext(BountiesContext);

  function bountyCreated (newBounty: IBounty) {
    setDisplayBountyDialog(false);
  }
  return (
    <Grid container>

      <Grid item container xs alignItems='center'>

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
          <h1>Bounty list</h1>
        </Grid>

        <Grid item xs={4}>
          <Button
            variant='outlined'
            onClick={() => {
              setDisplayBountyDialog(true);
            }}
            sx={{ margin: 'auto', float: 'right' }}
          >
            Create Bounty
          </Button>
        </Grid>

      </Grid>

      <Grid container>
        {
          bounties.length === 0
            ? <Typography paragraph={true}>No bounties were found</Typography>
            : bounties?.map(bounty => {
              return <BountyCard key={bounty.id} bounty={bounty} />;
            })
        }
      </Grid>
    </Grid>
  );
}
