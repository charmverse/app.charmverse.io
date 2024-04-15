import type { CredentialTemplate } from '@charmverse/core/dist/cjs/prisma-client';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Image from 'next/image';

import { useGetCredentialTemplates } from 'charmClient/hooks/credentials';
import { IssueProposalCredentials } from 'components/common/DatabaseEditor/components/viewHeader/ViewHeaderRowsMenu/components/IssueProposalCredentials';
import { useProposalCredentials } from 'components/proposals/hooks/useProposalCredentials';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useSmallScreen } from 'hooks/useMediaScreens';
import { useSnackbar } from 'hooks/useSnackbar';
import { useSpaceFeatures } from 'hooks/useSpaceFeatures';
import { useUser } from 'hooks/useUser';
import type { ProposalCredential } from 'lib/credentials/schemas/proposal';

import { CredentialRow } from './CredentialRow';

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
  const { issuedCredentials, issuableProposalCredentials, refreshIssuedCredentials } = useProposalCredentials({
    proposalId
  });
  const { space } = useCurrentSpace();
  const isSmallScreen = useSmallScreen();
  const { credentialTemplates } = useGetCredentialTemplates();
  const { getFeatureTitle } = useSpaceFeatures();

  const pendingCredentials = selectedCredentialTemplates
    .map((templateId) => credentialTemplates?.find((ct) => ct.id === templateId))
    .filter(Boolean) as CredentialTemplate[];

  return (
    <Box display='flex' flexDirection='column' gap={2} onClick={preventAccordionToggle}>
      <Typography variant='body2'>
        Authors receive credentials when the {getFeatureTitle('proposal')} is approved
      </Typography>

      <Stack gap={1.5}>
        {!issuedCredentials?.length &&
          pendingCredentials?.map((cred) => (
            <CredentialRow
              credential={{ title: cred.name, subtitle: cred.organization }}
              isSmallScreen={isSmallScreen}
              key={cred.id}
            />
          ))}
        {issuedCredentials?.map((c) => {
          const content = c.content as ProposalCredential;
          return (
            <CredentialRow
              credential={{ title: content.Name, subtitle: content.Description }}
              key={c.id}
              verificationUrl={c.verificationUrl}
            />
          );
        })}
      </Stack>

      {space?.useOnchainCredentials && space.credentialsWallet && issuableProposalCredentials?.length ? (
        <Box display='flex' justifyContent='flex-end'>
          <Box width='fit-content'>
            <IssueProposalCredentials
              selectedPageIds={[proposalId]}
              onIssueCredentialsSuccess={refreshIssuedCredentials}
            />
          </Box>
        </Box>
      ) : null}
    </Box>
  );
}
