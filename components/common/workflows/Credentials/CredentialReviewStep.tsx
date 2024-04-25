import type { CredentialTemplate } from '@charmverse/core/dist/cjs/prisma-client';
import { Box, Stack } from '@mui/material';

import { IssueProposalCredentials } from 'components/common/DatabaseEditor/components/viewHeader/ViewHeaderRowsMenu/components/IssueProposalCredentials';
import { IssueRewardCredentials } from 'components/common/DatabaseEditor/components/viewHeader/ViewHeaderRowsMenu/components/IssueRewardCredentials';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useSmallScreen } from 'hooks/useMediaScreens';
import type { EASAttestationFromApi } from 'lib/credentials/external/getOnchainCredentials';

import { CredentialRow } from './CredentialRow';

export function CredentialReviewStep({
  pendingCredentials,
  issuedCredentials,
  canIssueCredentials,
  pageId,
  type,
  onIssueCredentialsSuccess
}: {
  pendingCredentials: CredentialTemplate[];
  issuedCredentials: EASAttestationFromApi[];
  canIssueCredentials: boolean;
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
          pendingCredentials.map((cred) => (
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

      {space?.useOnchainCredentials && space.credentialsWallet && canIssueCredentials ? (
        <Box display='flex' justifyContent='flex-end'>
          <Box width='fit-content'>
            {type === 'reward' ? (
              <IssueRewardCredentials selectedPageIds={[pageId]} />
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
