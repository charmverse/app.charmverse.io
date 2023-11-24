import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import { useEffect, useState } from 'react';

import { Button } from 'components/common/Button';
import Link from 'components/common/Link';
import { getENSName } from 'lib/blockchain';
import type { SignedCredential } from 'lib/credentials/attest';

type Props = {
  credential: SignedCredential;
};

export function ProposalCredentialCard({ credential }: Props) {
  return (
    <Card sx={{ minWidth: 275 }}>
      <CardContent>
        <Grid container>
          <Grid item>
            <Typography sx={{ fontSize: 14 }} color='text.secondary' gutterBottom>
              Credential issued by {credential.signer.ensname ?? credential.signer.wallet}
            </Typography>
          </Grid>
          <Grid item>
            <Typography variant='body2'>
              <b>Organization:</b> {credential.credentialData.data.organization}
            </Typography>
          </Grid>
          <Grid item>
            <Typography variant='body2'>
              <b>Name:</b> {credential.credentialData.data.name}
            </Typography>
          </Grid>
          <Grid item>
            <Typography variant='body2'>
              <b>Description:</b> {credential.credentialData.data.description}
            </Typography>
          </Grid>
          <Grid item>
            <Typography variant='body2'>
              <b>Status:</b> {credential.credentialData.data.status}
            </Typography>
          </Grid>
          <Grid item>
            <Link>{credential.credentialData.data.url}</Link>
          </Grid>
        </Grid>
      </CardContent>
      <CardActions>
        <Button external target='_blank' href={credential.verificationUrl} size='small'>
          Verify
        </Button>
      </CardActions>
    </Card>
  );
}
