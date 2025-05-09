import { MoreHoriz } from '@mui/icons-material';
import LaunchIcon from '@mui/icons-material/Launch';
import PublishIcon from '@mui/icons-material/Publish';
import StarBorderOutlinedIcon from '@mui/icons-material/StarBorderOutlined';
import StarOutlinedIcon from '@mui/icons-material/StarOutlined';
import { IconButton, Stack, Tooltip } from '@mui/material';
import type { EASAttestationWithFavorite } from '@packages/credentials/external/getOnchainCredentials';

import Link from 'components/common/Link';
import PopperPopup from 'components/common/PopperPopup';
import { Typography } from 'components/common/Typography';

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
          {credential.type === 'charmverse' && (
            <Typography variant='caption' color='text.secondary'>
              <PublishIcon sx={{ alignSelf: 'center' }} fontSize='small' />
              Publish Credential Onchain
            </Typography>
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
