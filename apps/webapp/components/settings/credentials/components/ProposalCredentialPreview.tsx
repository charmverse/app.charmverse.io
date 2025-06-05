import type { AttestationType, CredentialTemplate } from '@charmverse/core/prisma-client';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import { getEasConnector } from '@packages/credentials/connectors';
import { credentialEventLabels } from '@packages/credentials/constants';
import { attestationSchemaIds } from '@packages/credentials/schemas/index';
import { optimism } from 'viem/chains';

import Link from 'components/common/Link';
import { useSpaceFeatures } from 'hooks/useSpaceFeatures';

export type ProposalCredentialToPreview = Pick<CredentialTemplate, 'name' | 'description' | 'organization'>;

type Props = {
  credential: ProposalCredentialToPreview;
  credentialTemplateType: AttestationType;
};

export function ProposalCredentialPreview({ credential, credentialTemplateType }: Props) {
  const { getFeatureTitle } = useSpaceFeatures();
  const proposalSchemaUrl = `${getEasConnector(optimism.id).attestationExplorerUrl}/schema/view/${
    attestationSchemaIds[credentialTemplateType]
  }`;
  return (
    <Card sx={{ minWidth: 275 }}>
      <CardContent>
        <Grid container display='flex' flexDirection='column' gap={1.5}>
          <Grid size='grow'>
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
          <Grid size='grow'>
            <Typography variant='body2'>
              <b>Organization:</b> {credential.organization}
            </Typography>
          </Grid>
          <Grid size='grow'>
            <Typography variant='body2'>
              <b>Name:</b> {credential.name}
            </Typography>
          </Grid>
          <Grid size='grow'>
            <Typography variant='body2'>
              <b>Description:</b> {credential.description}
            </Typography>
          </Grid>
          <Grid size='grow'>
            <Typography variant='body2'>
              <b>Event:</b>{' '}
              {credentialTemplateType === 'proposal'
                ? credentialEventLabels.proposal_approved?.(getFeatureTitle)
                : credentialEventLabels.reward_submission_approved?.(getFeatureTitle)}
            </Typography>
          </Grid>
          <Grid size='grow'>
            <Typography variant='body2'>
              <b>URL:</b> [Link to {getFeatureTitle(credentialTemplateType === 'proposal' ? 'proposal' : 'reward')}]
            </Typography>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
}
