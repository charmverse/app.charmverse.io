import type { CredentialTemplate } from '@charmverse/core/prisma-client';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

import { useGetCredentialTemplates } from 'charmClient/hooks/credentials';
import { CredentialReviewStep } from 'components/common/WorkflowSidebar/components/CredentialReviewStep/CredentialReviewStep';
import type { ApplicationWithTransactions } from '@packages/lib/rewards/interfaces';

export type UserCredentialRowProps = {
  credential: { title: string; subtitle: string; iconUrl: string };
  isSmallScreen?: boolean;
  verificationUrl?: string;
};

const preventAccordionToggle = (e: any) => e.stopPropagation();

export function CredentialsStepReview({
  selectedCredentialTemplates,
  rewardId,
  application,
  refreshApplication
}: {
  selectedCredentialTemplates: string[];
  rewardId: string;
  application?: ApplicationWithTransactions;
  refreshApplication?: VoidFunction;
}) {
  const issuableCredentials = application?.issuableOnchainCredentials ?? [];

  const issuableRewardCredentials = issuableCredentials.filter((issuable) => issuable.rewardId === rewardId);
  const { credentialTemplates } = useGetCredentialTemplates();

  const selectedCredentials = selectedCredentialTemplates
    .map((templateId) => credentialTemplates?.find((ct) => ct.id === templateId))
    .filter(Boolean) as CredentialTemplate[];

  return (
    <Box display='flex' flexDirection='column' gap={2} onClick={preventAccordionToggle}>
      <Typography variant='body2'>Submitters receive credentials when their submission is approved</Typography>

      <CredentialReviewStep
        hasPendingOnchainCredentials={issuableRewardCredentials.length > 0}
        issuedCredentials={application?.issuedCredentials ?? []}
        pageId={rewardId}
        selectedCredentials={selectedCredentials}
        type='reward'
        onIssueCredentialsSuccess={refreshApplication}
        applicationId={application?.id}
      />
    </Box>
  );
}
