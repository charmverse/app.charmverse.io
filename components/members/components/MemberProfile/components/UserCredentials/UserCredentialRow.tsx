import LaunchIcon from '@mui/icons-material/Launch';
import StarBorderOutlinedIcon from '@mui/icons-material/StarBorderOutlined';
import StarOutlinedIcon from '@mui/icons-material/StarOutlined';
import { Chip, Grid, IconButton, Tooltip, Typography } from '@mui/material';
import Box from '@mui/material/Box';
import Image from 'next/image';

import Link from 'components/common/Link';
import { useFavoriteCredentials } from 'hooks/useFavoriteCredentials';
import { useSmallScreen } from 'hooks/useMediaScreens';
import { useSnackbar } from 'hooks/useSnackbar';
import { useUser } from 'hooks/useUser';
import type { EASAttestationWithFavorite } from 'lib/credentials/external/getOnchainCredentials';
import { trackedSchemas } from 'lib/credentials/external/schemas';
import { lowerCaseEqual } from 'lib/utilities/strings';

export function UserCredentialRow({
  credential,
  readOnly = false
}: {
  credential: EASAttestationWithFavorite;
  readOnly?: boolean;
}) {
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

  const isSmallScreen = useSmallScreen();
  const credentialInfo: {
    title: string;
    subtitle: string;
    iconUrl: string;
    attestationContent: { name: string; value: string }[];
  } =
    credential.type === 'charmverse'
      ? {
          title: credential.content.name,
          subtitle: credential.content.organization,
          iconUrl: credential.iconUrl ?? '/images/logo_black_lightgrey.png',
          attestationContent: [{ name: 'status', value: credential.content.status }]
        }
      : credential.type === 'gitcoin'
      ? {
          title: 'Gitcoin Passport Score',
          subtitle: 'Gitcoin',
          iconUrl: '/images/logos/Gitcoin_Passport_Logomark_SeaFoam.svg',
          attestationContent: [
            { name: 'Passport Score', value: `Passport Score: ${credential.content.passport_score?.toFixed(2)}` }
          ]
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

  return (
    <Grid container display='flex' gap={{ xs: 1 }} alignItems='center' justifyContent='space-between'>
      <Grid item xs={12} md={5}>
        <Box
          display='flex'
          alignItems='center'
          gap={{
            xs: 1,
            md: 2
          }}
        >
          <Image
            src={credentialInfo.iconUrl}
            alt='charmverse-logo'
            height={isSmallScreen ? 40 : 30}
            width={isSmallScreen ? 40 : 30}
          />
          <Box display='flex' flexDirection='column'>
            <Typography variant='body1' fontWeight='bold'>
              {credentialInfo.title}
            </Typography>
            <Typography variant='caption' fontWeight='bold'>
              {credentialInfo.subtitle}
            </Typography>
          </Box>
        </Box>
      </Grid>
      <Grid item display='flex' justifyContent='flex-start' xs={8} md={credential.verificationUrl ? 4 : 5} gap={1}>
        {credentialInfo.attestationContent.map((field) => (
          <Chip size={isSmallScreen ? 'small' : 'medium'} variant='outlined' key={field.name} label={field.value} />
        ))}
      </Grid>
      {isUserRecipient && !readOnly && (
        <Grid item xs={1} display='flex' justifyContent='flex-end'>
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
        </Grid>
      )}
      {credential.verificationUrl && (
        <Grid item xs={1} display='flex' justifyContent='flex-end'>
          <Link href={credential.verificationUrl} external target='_blank'>
            <LaunchIcon sx={{ alignSelf: 'center' }} fontSize={isSmallScreen ? 'small' : 'medium'} />
          </Link>
        </Grid>
      )}
    </Grid>
  );
}
