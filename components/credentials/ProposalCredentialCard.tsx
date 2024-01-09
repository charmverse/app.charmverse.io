import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import { useMemo } from 'react';

import { Button } from 'components/common/Button';
import Link from 'components/common/Link';
import type { PublishedSignedCredential } from 'lib/credentials/config/queriesAndMutations';
import type { ProposalCredential } from 'lib/credentials/schemas';

type Props = {
  credential: PublishedSignedCredential;
};

export function ProposalCredentialCard({ credential }: Props) {
  const content = useMemo(() => JSON.parse(credential.content) as ProposalCredential, []);

  return (
    <Card sx={{ minWidth: 275 }}>
      <CardContent>
        <Grid container>
          <Grid item>
            <Typography sx={{ fontSize: 14 }} color='text.secondary' gutterBottom>
              Credential issued by {credential.issuer}
            </Typography>
          </Grid>
          <Grid item>
            <Typography variant='body2'>
              <b>Organization:</b> {content.organization}
            </Typography>
          </Grid>
          <Grid item>
            <Typography variant='body2'>
              <b>Name:</b> {content.name}
            </Typography>
          </Grid>
          <Grid item>
            <Typography variant='body2'>
              <b>Description:</b> {content.description}
            </Typography>
          </Grid>
          <Grid item>
            <Typography variant='body2'>
              <b>Status:</b> {content.status}
            </Typography>
          </Grid>
          <Grid item>
            <Link>{credential.verificationUrl}</Link>
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
