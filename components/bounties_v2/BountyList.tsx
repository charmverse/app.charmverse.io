import { Button, Grid, Typography } from '@mui/material';
import { Bounty as IBounty } from '@prisma/client';
import charmClient from 'charmClient';
import BountyModal from 'components/bounties_v2/BountyModal';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useState } from 'react';
import { BountyCard } from './BountyCard';

export function BountyList () {
  const [space] = useCurrentSpace();
  const [bountyList, setBountyList] = useState([] as IBounty []);
  const [displayBountyDialog, setDisplayBountyDialog] = useState(false);

  async function refreshBounties () {
    try {
      const foundBounties = await charmClient.listBounties(space!.id);

      setBountyList(foundBounties);

    }
    catch (error) {
      // Handle error later
    }
  }

  function bountyCreated (newBounty: IBounty) {
    // Empty the bounty list so we can reload bounties
    setDisplayBountyDialog(false);
    // refreshBounties();
    setBountyList([...bountyList, newBounty]);
  }

  // if (refresh.current === true) {
  //   // TODO: No need to refresh bounties we can add the newly created bounty to the list
  //   refreshBounties();

  //   return <Loader message='Searching for bounties' />;
  // }
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
          bountyList.length === 0 && <Typography paragraph={true}>No bounties were found</Typography>
        }

        { bountyList.length > 0
      && bountyList?.map(availableBounty => {
        return <BountyCard key={availableBounty.id + Math.random().toString()} bounty={availableBounty} />;
      })}

      </Grid>

    </Grid>
  );
}
