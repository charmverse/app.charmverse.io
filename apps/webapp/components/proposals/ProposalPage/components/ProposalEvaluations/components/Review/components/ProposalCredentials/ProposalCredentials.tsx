import type { CredentialTemplate } from '@charmverse/core/prisma-client';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

import { useGetCredentialTemplates } from 'charmClient/hooks/credentials';
import { useProposal } from 'components/[pageId]/DocumentPage/hooks/useProposal';
import { CredentialReviewStep } from 'components/common/WorkflowSidebar/components/CredentialReviewStep/CredentialReviewStep';
import { useProposalCredentials } from 'components/proposals/hooks/useProposalCredentials';
import { useSpaceFeatures } from 'hooks/useSpaceFeatures';

export type UserCredentialRowProps = {
  credential: { title: string; subtitle: string; iconUrl: string };
  isSmallScreen?: boolean;
  verificationUrl?: string;
};

const preventAccordionToggle = (e: any) => e.stopPropagation();

export function ProposalCredentials({
  selectedCredentialTemplates,
  proposalId
}: {
  selectedCredentialTemplates: string[];
  proposalId: string;
}) {
  const { issuableProposalCredentials } = useProposalCredentials({
    proposalId
  });
  const { proposal, refreshProposal } = useProposal({ proposalId });
  const { credentialTemplates } = useGetCredentialTemplates();
  const { getFeatureTitle } = useSpaceFeatures();

  const selectedCredentials = selectedCredentialTemplates
    .map((templateId) => credentialTemplates?.find((ct) => ct.id === templateId))
    .filter(Boolean) as CredentialTemplate[];

  return (
    <Box display='flex' flexDirection='column' gap={2} onClick={preventAccordionToggle}>
      <Typography variant='body2'>
        Authors receive credentials when the {getFeatureTitle('proposal')} is approved
      </Typography>

      <CredentialReviewStep
        hasPendingOnchainCredentials={!!(issuableProposalCredentials && issuableProposalCredentials.length > 0)}
        issuedCredentials={proposal?.issuedCredentials ?? []}
        pageId={proposalId}
        selectedCredentials={selectedCredentials}
        type='proposal'
        onIssueCredentialsSuccess={refreshProposal}
      />
    </Box>
  );
}
