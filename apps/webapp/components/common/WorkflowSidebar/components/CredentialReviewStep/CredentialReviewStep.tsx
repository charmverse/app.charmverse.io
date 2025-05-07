import type { CredentialTemplate } from '@charmverse/core/prisma-client';
import { Box, Stack } from '@mui/material';
import type { EASAttestationFromApi } from '@packages/credentials/external/getOnchainCredentials';
import dynamic from 'next/dynamic';

import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useSmallScreen } from 'hooks/useMediaScreens';

import { CredentialRow } from './CredentialRow';

const IssueRewardCredentials = dynamic(() =>
  import(
    'components/common/DatabaseEditor/components/viewHeader/ViewHeaderRowsMenu/components/IssueRewardCredentials'
  ).then((mod) => mod.IssueRewardCredentials)
);
const IssueProposalCredentials = dynamic(() =>
  import(
    'components/common/DatabaseEditor/components/viewHeader/ViewHeaderRowsMenu/components/IssueProposalCredentials'
  ).then((mod) => mod.IssueProposalCredentials)
);

export function CredentialReviewStep({
  selectedCredentials,
  issuedCredentials,
  hasPendingOnchainCredentials,
  pageId,
  type,
  onIssueCredentialsSuccess,
  applicationId
}: {
  selectedCredentials: CredentialTemplate[];
  issuedCredentials: EASAttestationFromApi[];
  hasPendingOnchainCredentials: boolean;
  pageId: string;
  type: 'reward' | 'proposal';
  onIssueCredentialsSuccess?: VoidFunction;
  applicationId?: string;
}) {
  const { space } = useCurrentSpace();
  const isSmallScreen = useSmallScreen();

  return (
    <>
      <Stack gap={1.5}>
        {issuedCredentials.length === 0 &&
          selectedCredentials.map((cred) => (
            <CredentialRow
              credential={{ title: cred.name, subtitle: cred.organization }}
              isSmallScreen={isSmallScreen}
              key={cred.id}
            />
          ))}

        {issuedCredentials?.map((c) => {
          const content = c.content;
          return (
            <CredentialRow
              credential={{ title: content.Name, subtitle: content.Description }}
              key={c.id}
              verificationUrl={c.verificationUrl}
            />
          );
        })}
      </Stack>

      {space?.useOnchainCredentials && space.credentialsWallet && hasPendingOnchainCredentials ? (
        <Box display='flex' justifyContent='flex-end'>
          <Box width='fit-content'>
            {type === 'reward' ? (
              <IssueRewardCredentials
                selectedPageIds={[pageId]}
                onIssueCredentialsSuccess={onIssueCredentialsSuccess}
                applicationId={applicationId}
              />
            ) : (
              <IssueProposalCredentials
                selectedPageIds={[pageId]}
                onIssueCredentialsSuccess={onIssueCredentialsSuccess}
              />
            )}
          </Box>
        </Box>
      ) : null}
    </>
  );
}
