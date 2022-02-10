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
    <Grid container direction='row' spacing={3} sx={{ padding: '16px' }}>
      {bounties.map((bounty: any) => (
        <Grid item key={bounty.id}>
          {/* // xtungvo TODO: update to handle action for editing bounty */}
          <BountyCard bounty={bounty} />
        </Grid>
      ))}
    </Grid>
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
        <Typography
          sx={{
            fontSize: '30px',
            color: '#6A6A6A',
            fontWeight: 'bold'
          }}
        >
          Suggestions
        </Typography>
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
      <Typography
        sx={{
          fontSize: '30px',
          color: '#6A6A6A',
          fontWeight: 'bold',
          marginLeft: '16px'
        }}
      >
        Bounty Panel
      </Typography>
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
