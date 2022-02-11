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
import Button from '@mui/material/Button';

import { ReactElement, useState } from 'react';
import Box from '@mui/material/Box';
import { Typography } from '@mui/material';
import { TBountyCard } from 'models/Bounty';

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
          margin: '8px 0',
          alignItems: 'center'
        }}
      >
        {/* // xtungvo TODO: update correct variant style */}
        <Typography variant='h1'>Bounty Panel</Typography>
        <Button
          onClick={() => {
            setBountyDialogOpen(true);
          }}
        >
          New Bounty (+)
        </Button>
      </Box>
      <Grid container direction='row' spacing={3} sx={{ marginTop: '8px' }}>
        {bounties.map((bounty: any) => (
          <Grid item key={bounty.id}>
            {/* // xtungvo TODO: update to handle action for editing bounty */}
            <BountyCard bounty={bounty} />
          </Grid>
        ))}
      </Grid>
      <BountyModal
        key={new Date().getDate()}
        open={bountyDialogOpen}
        onClose={() => setBountyDialogOpen(false)}
        modalType='create'
        onSubmit={(creatingBounty: TBountyCard) => {
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
          borderBottom: '1px solid',
          borderColor: 'divider',
          margin: '8px 0',
          alignItems: 'center'
        }}
      >
        {/* // xtungvo TODO: update correct variant style */}
        <Typography variant='h1'>Suggestions</Typography>
        <Button
          onClick={() => {
            setBountyDialogOpen(true);
          }}
        >
          Suggest (+)
        </Button>
      </Box>
      <BountyTable items={suggestedBounties} />
      <BountyModal
        key={new Date().getDate()}
        open={bountyDialogOpen}
        onClose={() => setBountyDialogOpen(false)}
        modalType='suggest'
        onSubmit={(creatingBounty: TBountyCard) => {
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
