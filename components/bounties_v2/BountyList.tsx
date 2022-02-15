import { useState } from 'react';
import { Bounty as IBounty } from 'models/Bounty';
import Loader from 'components/common/Loader';
import { Bounty } from 'components/bounties_v2/Bounty';
import { Typography, Button } from '@mui/material';
import BountyService from './BountyService';
import { BountyEditor } from './BountyEditor';

export function BountyList () {

  const [bountyList, setBountyList] = useState(undefined as any as IBounty []);
  const [displayBountyDialog, setDisplayBountyDialog] = useState(false);

  if (bountyList === undefined) {
    BountyService.listBounties().then(foundBounties => {
      setBountyList(foundBounties);
    });
  }

  function bountyCreated () {
    // Empty the bounty list so we can reload bounties
    setBountyList(undefined as any);
  }

  if (bountyList === undefined) {
    return <Loader message='Searching for bounties' />;
  }
  else {
    return (
      <>

        {
        bountyList.length === 0 && <Typography paragraph={true}>No bounties were found</Typography>
      }

        { bountyList.length > 0
        && bountyList.map(availableBounty => {
          return <Bounty bounty={availableBounty} />;
        })}

        <Button
          variant='outlined'
          onClick={() => {
            setDisplayBountyDialog(true);
          }}
        >
          Create Bounty
        </Button>

        {
          /**
           * Remove later to its own popup modal
           */
          displayBountyDialog === true && <BountyEditor onSubmit={bountyCreated} />
        }
      </>
    );
  }
}
