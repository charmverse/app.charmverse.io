import LaunchIcon from '@mui/icons-material/Launch';
import StarBorderOutlinedIcon from '@mui/icons-material/StarBorderOutlined';
import StarOutlinedIcon from '@mui/icons-material/StarOutlined';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import { Chip, IconButton, Stack, Tooltip, Typography } from '@mui/material';
import Box from '@mui/material/Box';
import type { OverridableComponent } from '@mui/material/OverridableComponent';
import type { SvgIconTypeMap } from '@mui/material/SvgIcon';
import type {
  EASAttestationFromApi,
  EASAttestationWithFavorite
} from '@packages/credentials/external/getOnchainCredentials';
import { trackedCharmverseSchemas, trackedSchemas } from '@packages/credentials/external/schemas';
import { externalCredentialSchemaId } from '@packages/credentials/schemas/external';
import { charmverseCredentialSchemas } from '@packages/credentials/schemas/index';
import { type CredentialDataInput } from '@packages/credentials/schemas/interfaces';
import { proposalCredentialSchemaId } from '@packages/credentials/schemas/proposal';
import { rewardCredentialSchemaId } from '@packages/credentials/schemas/reward';
import { lowerCaseEqual } from '@packages/utils/strings';
import Image from 'next/image';

import Link from 'components/common/Link';
import { useFavoriteCredentials } from 'hooks/useFavoriteCredentials';
import { useSmallScreen } from 'hooks/useMediaScreens';
import { useSnackbar } from 'hooks/useSnackbar';
import { useUser } from 'hooks/useUser';

export type UserCredentialRowProps = {
  credential: EASAttestationFromApi & Partial<Pick<EASAttestationWithFavorite, 'favoriteCredentialId' | 'index'>>;
  readOnly?: boolean;
  smallScreen?: boolean;
  hideFavourite?: boolean;
};

export function UserCredentialRow({
  credential,
  readOnly = false,
  smallScreen,
  hideFavourite
}: UserCredentialRowProps) {
  const isSmallScreen = useSmallScreen() || smallScreen;
  const { addFavorite, removeFavorite, isRemoveFavoriteCredentialLoading, isAddFavoriteCredentialLoading } =
    useFavoriteCredentials();
  const { showMessage } = useSnackbar();
  const schemaInfo = (
    trackedSchemas[credential.chainId as keyof typeof trackedSchemas] ??
    trackedCharmverseSchemas[credential.chainId as keyof typeof trackedCharmverseSchemas]
  )?.find((s) => s.schemaId === credential.schemaId);
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
          attestationId:
            (credential.type === 'onchain' || credential.type === 'charmverse') && credential.id.startsWith('0x')
              ? credential.id
              : undefined,
          issuedCredentialId: credential.type === 'charmverse' ? credential.issuedCredentialId : undefined,
          gitcoinWalletAddress: credential.type === 'gitcoin' ? credential.recipient : undefined
        });
      }
    } catch (_) {
      showMessage(`Failed to ${credential.favoriteCredentialId ? 'unfavorite' : 'favorite'} credential`, 'error');
    }
  }

  const charmCredential = credential.content as CredentialDataInput;

  const credentialInfo: {
    title: string;
    subtitle: string | string[];
    iconUrl: string | OverridableComponent<SvgIconTypeMap>;
    attestationContent: { name: string; value: string }[];
  } =
    (credential.type === 'charmverse' ||
      (credential.type === 'onchain' && charmverseCredentialSchemas.includes(credential.schemaId))) &&
    'Organization' in charmCredential
      ? {
          title: charmCredential.Name,
          subtitle: charmCredential.Organization,
          iconUrl: credential.iconUrl ?? '/images/logo_black_lightgrey.png',
          attestationContent: [{ name: 'Event', value: charmCredential.Event }]
        }
      : credential.type === 'charmverse' &&
          credential.schemaId === externalCredentialSchemaId &&
          'GrantRound' in charmCredential &&
          charmCredential.Source === 'Gitcoin'
        ? {
            title: charmCredential.Name,
            subtitle: ['Gitcoin Round', charmCredential.GrantRound],
            iconUrl: credential.iconUrl ?? '/images/logos/gitcoin-logo.png',
            attestationContent: [{ name: 'Event', value: charmCredential.Event }]
          }
        : credential.type === 'charmverse' &&
            credential.schemaId === externalCredentialSchemaId &&
            'GrantRound' in charmCredential &&
            charmCredential.Source === 'Questbook'
          ? {
              title: charmCredential.Name,
              subtitle: charmCredential.GrantRound,
              iconUrl: credential.iconUrl ?? WorkspacePremiumIcon,
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
                subtitle: [proposalCredentialSchemaId, rewardCredentialSchemaId].includes(credential.schemaId)
                  ? credential.content.Organization
                  : (schemaInfo?.organization ?? ''),
                iconUrl: credential.iconUrl ?? schemaInfo?.iconUrl ?? '',
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
            height: 20,
            marginTop: 3
          }}
          href={credential.verificationUrl}
          external
          target='_blank'
        >
          <LaunchIcon sx={{ alignSelf: 'center' }} fontSize='small' />
        </Link>
      )}
      {isUserRecipient && !readOnly && credential.schemaId !== externalCredentialSchemaId && !hideFavourite && (
        <Tooltip title={isMutating ? '' : !credential.favoriteCredentialId ? 'Favorite' : 'Unfavorite'}>
          <div>
            <IconButton sx={{ p: 0 }} size='small' onClick={toggleFavorite} disabled={isMutating}>
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
      {typeof credentialInfo.iconUrl === 'string' ? (
        <Image
          src={credentialInfo.iconUrl}
          alt='charmverse-logo'
          height={isSmallScreen ? 40 : 30}
          width={isSmallScreen ? 40 : 30}
        />
      ) : (
        <credentialInfo.iconUrl fontSize='large' />
      )}
      <Box display='flex' flexDirection='column' flexGrow={1}>
        <Typography variant='body1' fontWeight='bold'>
          {credentialInfo.title}
        </Typography>
        {typeof credentialInfo.subtitle === 'string' ? (
          <Typography variant='caption'>{credentialInfo.subtitle}</Typography>
        ) : (
          <>
            {credentialInfo.subtitle.map((sub) => (
              <Typography variant='caption' key={sub}>
                {sub}
              </Typography>
            ))}
          </>
        )}
      </Box>
    </>
  );

  const attestationContentComponent = credentialInfo.attestationContent.length ? (
    <Stack flexDirection='row' gap={1} justifySelf='flex-start' flexGrow={isSmallScreen ? 1 : undefined}>
      {credentialInfo.attestationContent.map((field) => (
        <Chip size={isSmallScreen ? 'small' : 'medium'} variant='outlined' key={field.name} label={field.value} />
      ))}
    </Stack>
  ) : (
    <div />
  );

  // Readd this later
  // const hideAndPublishComponent = (
  //   <UserCredentialHideAndPublish
  //     credential={credential}
  //     isSmallScreen={isSmallScreen}
  //     isUserRecipient={!!isUserRecipient}
  //     readOnly={readOnly}
  //     isMutating={isMutating}
  //     toggleFavorite={toggleFavorite}
  //   />
  // );

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
      <Stack justifyContent='space-between' alignItems='center' flexDirection='row' width='50%'>
        {attestationContentComponent}
        {favoriteAndVerificationIconsComponent}
      </Stack>
      {/* {hideAndPublishComponent} */}
    </Stack>
  );
}
