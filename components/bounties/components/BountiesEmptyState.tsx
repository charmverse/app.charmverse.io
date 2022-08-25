import { Typography } from '@mui/material';

export default function BountiesEmptyState () {
  return (
    <div>
      <Typography variant='h6' gutterBottom>
        Getting started with bounties
      </Typography>

      {/* Onboarding video when no bounties exist */}
      <iframe
        src='https://tiny.charmverse.io/bounties'
        style={{ maxWidth: '100%', border: '0 none' }}
        height='367px'
        width='650px'
        title='Bounties | Getting started with Charmverse'
      >
      </iframe>
    </div>
  );
}
