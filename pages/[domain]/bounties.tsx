import { PageLayout } from 'components/common/page-layout';
import BountyCard from 'components/bounties/BountyCard';
import BountyTable from 'components/bounties/BountyTable';
import BountyModal from 'components/bounties/BountyModal';
import { BountyProvider, useBounty } from 'components/bounties/hooks/useBounty';
import {
  SuggestionProvider,
  useBountySuggestion
} from 'components/bounties/hooks/useBountySuggestion';

import Grid from '@mui/material/Grid';
import Button from 'components/common/Button';

import { ReactElement, useState } from 'react';
import Box from '@mui/material/Box';
import { Typography } from '@mui/material';
import { Bounty } from 'models/Bounty';

function BountyContainer (): ReactElement {
  const { bounties, addBounty } = useBounty();
  const [bountyDialogOpen, setBountyDialogOpen] = useState(false);
  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 2
        }}
      >
        <Typography variant='h1'>Bounties</Typography>
        <Button
          variant='outlined'
          onClick={() => {
            setBountyDialogOpen(true);
          }}
        >
          Create Bounty
        </Button>
      </Box>
      <Grid container direction='row' spacing={3}>
        {bounties.map((bounty: any) => (
          <Grid item key={bounty.id}>
            <BountyCard bounty={bounty} />
          </Grid>
        ))}
        {bounties.length === 0 && (
          <Grid item xs>
            <Box display='flex' justifyContent='center' py={4}>
              <Typography color='secondary'>No bounties to display</Typography>
            </Box>
          </Grid>
        )}
      </Grid>
      <BountyModal
        open={bountyDialogOpen}
        onClose={() => setBountyDialogOpen(false)}
        modalType='create'
        onSubmit={(creatingBounty: Bounty) => {
          addBounty(creatingBounty);
          setBountyDialogOpen(false);
        }}
      />
    </Box>
  );
}

function SuggestionContainer (): ReactElement {
  const { suggestedBounties, addBounty } = useBountySuggestion();
  const [bountyDialogOpen, setBountyDialogOpen] = useState(false);
  return (
    <>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-between',
          borderTop: '1px solid',
          borderColor: 'divider',
          py: 3,
          my: 3,
          alignItems: 'center'
        }}
      >
        <Typography variant='h2'>Suggested Bounties</Typography>
        <Button
          variant='outlined'
          onClick={() => {
            setBountyDialogOpen(true);
          }}
        >
          Suggest bounty
        </Button>
      </Box>
      {suggestedBounties.length > 0 && <BountyTable items={suggestedBounties} />}
      <BountyModal
        key={new Date().getDate()}
        open={bountyDialogOpen}
        onClose={() => setBountyDialogOpen(false)}
        modalType='suggest'
        onSubmit={(creatingBounty: Bounty) => {
          addBounty(creatingBounty);
          setBountyDialogOpen(false);
        }}
      />
    </>
  );
}
export default function BountyPage () {
  return (
    <Box p={3}>
      <BountyProvider>
        <BountyContainer />
      </BountyProvider>
      <SuggestionProvider>
        <SuggestionContainer />
      </SuggestionProvider>
    </Box>
  );
}

BountyPage.getLayout = (page: ReactElement) => {
  return <PageLayout>{page}</PageLayout>;
};
