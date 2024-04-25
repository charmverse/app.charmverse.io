import type { CredentialTemplate } from '@charmverse/core/dist/cjs/prisma-client';
import { Box, Stack } from '@mui/material';

import { IssueProposalCredentials } from 'components/common/DatabaseEditor/components/viewHeader/ViewHeaderRowsMenu/components/IssueProposalCredentials';
import { IssueRewardCredentials } from 'components/common/DatabaseEditor/components/viewHeader/ViewHeaderRowsMenu/components/IssueRewardCredentials';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useSmallScreen } from 'hooks/useMediaScreens';
import type { EASAttestationFromApi } from 'lib/credentials/external/getOnchainCredentials';

import { CredentialRow } from './CredentialRow';

export function CredentialReviewStep({
  selectedCredentials,
  issuedCredentials,
  hasPendingOnchainCredentials,
  pageId,
  type,
  onIssueCredentialsSuccess
}: {
  selectedCredentials: CredentialTemplate[];
  issuedCredentials: EASAttestationFromApi[];
  hasPendingOnchainCredentials: boolean;
  pageId: string;
  type: 'reward' | 'proposal';
  onIssueCredentialsSuccess?: VoidFunction;
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
