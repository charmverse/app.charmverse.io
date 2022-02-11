import { PageLayout } from 'components/common/page-layout';
import BountyCard from 'components/bounty/BountyCard';
import BountyTable from 'components/bounty/BountyTable';
import BountyEditorModal from 'components/bounty/BountyEditorModal';
import { BountyProvider, useBounty } from 'components/bounty/hooks/useBounty';
import {
  SuggestionProvider,
  useBountySuggestion
} from 'components/bounty/hooks/useBountySuggestion';

import Grid from '@mui/material/Grid';
import Button from '@mui/material/Button';

import { ReactElement, useState } from 'react';
import Box from '@mui/material/Box';
import { Typography } from '@mui/material';

function BountyContainer (): ReactElement {
  const { bounties } = useBounty();
  return (
    <Box sx={{ padding: '8px 16px' }}>
      <Typography variant='h1'>Bounty Panel</Typography>
      <Grid container direction='row' spacing={3} sx={{ marginTop: '8px' }}>
        {bounties.map((bounty: any) => (
          <Grid item key={bounty.id}>
            {/* // xtungvo TODO: update to handle action for editing bounty */}
            <BountyCard bounty={bounty} />
          </Grid>
        ))}
      </Grid>
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
          padding: '8px 16px',
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
      <BountyEditorModal
        open={bountyDialogOpen}
        onClose={() => {
          setBountyDialogOpen(false);
        }}
        onSubmit={(bounty) => {
          addBounty(bounty);
          setBountyDialogOpen(false);
        }}
      />
    </>
  );
}
export default function BountyPage () {
  return (
    <>
      <BountyProvider>
        <BountyContainer />
      </BountyProvider>
      <SuggestionProvider>
        <SuggestionContainer />
      </SuggestionProvider>
    </>
  );
}

BountyPage.getLayout = (page: ReactElement) => {
  return <PageLayout>{page}</PageLayout>;
};
