import { MoreHoriz } from '@mui/icons-material';
import LaunchIcon from '@mui/icons-material/Launch';
import StarBorderOutlinedIcon from '@mui/icons-material/StarBorderOutlined';
import StarOutlinedIcon from '@mui/icons-material/StarOutlined';
import { IconButton, Stack, Tooltip } from '@mui/material';

import Link from 'components/common/Link';
import PopperPopup from 'components/common/PopperPopup';
import type { EASAttestationWithFavorite } from 'lib/credentials/external/getOnchainCredentials';

export function UserCredentialHideAndPublish({
  credential,
  isSmallScreen,
  isUserRecipient,
  readOnly,
  isMutating,
  toggleFavorite
}: {
  credential: EASAttestationWithFavorite;
  isSmallScreen?: boolean;
  isUserRecipient: boolean;
  readOnly: boolean;
  isMutating: boolean;
  toggleFavorite: () => void;
}) {
  return (
    <PopperPopup
      closeOnClick
      popupContent={
        <Stack
          flexBasis={isSmallScreen ? undefined : '30%'}
          justifyContent='flex-end'
          alignItems='center'
          flexDirection='column'
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
              Icon Label
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
      }
    >
      <IconButton size='small'>
        <MoreHoriz fontSize='small' />
      </IconButton>
    </PopperPopup>
  );
}
