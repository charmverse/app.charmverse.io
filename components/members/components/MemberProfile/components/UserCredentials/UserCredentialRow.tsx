import LaunchIcon from '@mui/icons-material/Launch';
import StarBorderOutlinedIcon from '@mui/icons-material/StarBorderOutlined';
import StarOutlinedIcon from '@mui/icons-material/StarOutlined';
import { Chip, IconButton, Stack, Tooltip, Typography } from '@mui/material';
import Box from '@mui/material/Box';
import Image from 'next/image';

import Link from 'components/common/Link';
import { useFavoriteCredentials } from 'hooks/useFavoriteCredentials';
import { useSmallScreen } from 'hooks/useMediaScreens';
import { useSnackbar } from 'hooks/useSnackbar';
import { useUser } from 'hooks/useUser';
import type { EASAttestationWithFavorite } from 'lib/credentials/external/getOnchainCredentials';
import { trackedSchemas } from 'lib/credentials/external/schemas';
import type { ProposalCredential } from 'lib/credentials/schemas';
import { lowerCaseEqual } from 'lib/utilities/strings';

export function UserCredentialRow({
  credential,
  readOnly = false,
  smallScreen
}: {
  credential: EASAttestationWithFavorite;
  readOnly?: boolean;
  smallScreen?: boolean;
}) {
  const isSmallScreen = useSmallScreen() || smallScreen;
  const { addFavorite, removeFavorite, isRemoveFavoriteCredentialLoading, isAddFavoriteCredentialLoading } =
    useFavoriteCredentials();
  const { showMessage } = useSnackbar();
  const schemaInfo = trackedSchemas[credential.chainId]?.find((s) => s.schemaId === credential.schemaId);
  const { user } = useUser();
  const isUserRecipient = user?.wallets.find((wallet) => lowerCaseEqual(wallet.address, credential.recipient));
  const isMutating = isRemoveFavoriteCredentialLoading || isAddFavoriteCredentialLoading;
  async function toggleFavorite() {
    try {
      if (credential.favoriteCredentialId) {
        await removeFavorite(credential.favoriteCredentialId);
      } else {
        await addFavorite({
          chainId: credential.chainId,
          attestationId: credential.type === 'onchain' ? credential.id : undefined,
          issuedCredentialId: credential.type === 'charmverse' ? credential.issuedCredentialId : undefined,
          gitcoinWalletAddress: credential.type === 'gitcoin' ? credential.recipient : undefined
        });
      }
    } catch (_) {
      showMessage(`Failed to ${credential.favoriteCredentialId ? 'unfavorite' : 'favorite'} credential`, 'error');
    }
  }

  const charmCredential = credential.content as ProposalCredential;
  const credentialInfo: {
    title: string;
    subtitle: string;
    iconUrl: string;
    attestationContent: { name: string; value: string }[];
  } =
    credential.type === 'charmverse'
      ? {
          title: charmCredential.Name,
          subtitle: charmCredential.Organization,
          iconUrl: credential.iconUrl ?? '/images/logo_black_lightgrey.png',
          attestationContent: [{ name: 'Event', value: charmCredential.Event }]
        }
      : credential.type === 'gitcoin'
      ? {
          title: 'Gitcoin Passport Score',
          subtitle: 'Gitcoin',
          iconUrl: '/images/logos/gitcoin_passport.svg',
          attestationContent: [{ name: 'Passport Score', value: credential.content.passport_score?.toFixed(2) }]
        }
      : {
          title: schemaInfo?.title ?? '',
          subtitle: schemaInfo?.organization ?? '',
          iconUrl: schemaInfo?.iconUrl ?? '',
          attestationContent: (schemaInfo?.fields ?? []).map((fieldDef) => ({
            name: fieldDef.name,
            value: fieldDef.mapper
              ? fieldDef.mapper(credential.content[fieldDef.name])
              : credential.content[fieldDef.name]
          }))
        };

  if (credential.type === 'onchain' && !schemaInfo) {
    return null;
  }

  const favoriteAndVerificationIconsComponent = (
    <Stack
      flexBasis={isSmallScreen ? undefined : '30%'}
      justifyContent='flex-end'
      alignItems='center'
      flexDirection='row'
      gap={1}
    >
      {credential.verificationUrl && (
        <Link
          style={{
            height: 20
          }}
          href={credential.verificationUrl}
          external
          target='_blank'
        >
          <LaunchIcon sx={{ alignSelf: 'center' }} fontSize='small' />
        </Link>
      )}
      {isUserRecipient && !readOnly && (
        <Tooltip title={isMutating ? '' : !credential.favoriteCredentialId ? 'Favorite' : 'Unfavorite'}>
          <div>
            <IconButton size='small' onClick={toggleFavorite} disabled={isMutating}>
              {!credential.favoriteCredentialId ? (
                <StarBorderOutlinedIcon
                  color={isMutating ? 'disabled' : 'primary'}
                  fontSize='small'
                  sx={{ alignSelf: 'center' }}
                />
              ) : (
                <StarOutlinedIcon
                  color={isMutating ? 'disabled' : 'primary'}
                  fontSize='small'
                  sx={{ alignSelf: 'center' }}
                />
              )}
            </IconButton>
          </div>
        </Tooltip>
      )}
    </Stack>
  );

  const credentialOrganizationComponent = (
    <>
      <Image
        src={credentialInfo.iconUrl}
        alt='charmverse-logo'
        height={isSmallScreen ? 40 : 30}
        width={isSmallScreen ? 40 : 30}
      />
      <Box display='flex' flexDirection='column' flexGrow={1}>
        <Typography variant='body1' fontWeight='bold'>
          {credentialInfo.title}
        </Typography>
        <Typography variant='caption' fontWeight='bold'>
          {credentialInfo.subtitle}
        </Typography>
      </Box>
    </>
  );

  const attestationContentComponent = credentialInfo.attestationContent.length ? (
    <Stack flexDirection='row' gap={1} justifySelf='flex-start' flexGrow={isSmallScreen ? 1 : undefined}>
      {credentialInfo.attestationContent.map((field) => (
        <Chip size={isSmallScreen ? 'small' : 'medium'} variant='outlined' key={field.name} label={field.value} />
      ))}
    </Stack>
  ) : null;

  if (isSmallScreen) {
    return (
      <Stack gap={1}>
        <Box gap={2} display='flex' alignItems='center' justifyItems='flex-start'>
          {credentialOrganizationComponent}
          {favoriteAndVerificationIconsComponent}
        </Box>
        {attestationContentComponent}
      </Stack>
    );
  }

  return (
    <Stack gap={1} alignItems='center' justifyContent='space-between' flexDirection='row'>
      <Box gap={1} display='flex' alignItems='center' justifyItems='flex-start' flexBasis='50%'>
        {credentialOrganizationComponent}
      </Box>
      <Stack justifyContent='space-between' alignItems='center' flexDirection='row' flexGrow={1}>
        {attestationContentComponent}
        {favoriteAndVerificationIconsComponent}
      </Stack>
    </Stack>
  );
}
