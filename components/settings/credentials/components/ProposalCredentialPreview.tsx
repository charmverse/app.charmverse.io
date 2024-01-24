import type { CredentialTemplate } from '@charmverse/core/dist/cjs/prisma-client';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import { v4 as uuid } from 'uuid';

import Link from 'components/common/Link';
import { getEasConnector } from 'lib/credentials/connectors';
import { attestationSchemaIds } from 'lib/credentials/schemas';

export type ProposalCredentialToPreview = Pick<CredentialTemplate, 'name' | 'description' | 'organization'>;

type Props = {
  credential: ProposalCredentialToPreview;
};

export function ProposalCredentialPreview({ credential }: Props) {
  const proposalSchemaUrl = `${getEasConnector(10).attestationExplorerUrl}/schema/view/${
    attestationSchemaIds.proposal[10]
  }`;
  return (
    <Card sx={{ minWidth: 275 }}>
      <CardContent>
        <Grid container display='flex' flexDirection='column' gap={1.5}>
          <Grid item xs>
            <Typography
              fontWeight='bold'
              display='flex'
              sx={{ fontSize: 14, width: 'fit-content' }}
              color='text.secondary'
            >
              Credential Preview
            </Typography>
            <Link sx={{ fontSize: 12 }} href={proposalSchemaUrl} external target='_blank'>
              View Schema
            </Link>
          </Grid>
          <Grid item xs>
            <Typography variant='body2'>
              <b>Organization:</b> {credential.organization}
            </Typography>
          </Grid>
          <Grid item xs>
            <Typography variant='body2'>
              <b>Name:</b> {credential.name}
            </Typography>
          </Grid>
          <Grid item xs>
            <Typography variant='body2'>
              <b>Description:</b> {credential.description}
            </Typography>
          </Grid>
          <Grid item xs>
            <Typography variant='body2'>
              <b>Status:</b> Applied
            </Typography>
          </Grid>
          <Grid item xs>
            <Typography variant='body2'>
              <b>URL:</b> [Link to proposal]
            </Typography>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
}
