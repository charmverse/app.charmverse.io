import type { IdentityType } from '@charmverse/core/prisma-client';
import PersonOutlinedIcon from '@mui/icons-material/PersonOutlined';
import { Box, MenuItem, Select, Stack, Typography } from '@mui/material';
import { hasPrimaryMemberIdentityAccess } from '@packages/subscriptions/featureRestrictions';
import type { UseFormRegister } from 'react-hook-form';

import FieldLabel from 'components/common/form/FieldLabel';
import { IdentityIcon } from 'components/settings/profile/components/IdentityIcon';
import { useSpaceSubscription } from 'components/settings/subscription/hooks/useSpaceSubscription';

import type { FormValues } from '../SpaceSettings';

type Props = {
  disabled?: boolean;
  register: UseFormRegister<FormValues>;
  primaryIdentity?: IdentityType;
};

export function PrimaryMemberIdentity({ primaryIdentity, register, disabled }: Props) {
  const { subscriptionTier } = useSpaceSubscription();
  const hasAccess = hasPrimaryMemberIdentityAccess(subscriptionTier);

  if (!hasAccess) {
    return (
      <>
        <FieldLabel>Primary Identity</FieldLabel>
        <Typography variant='caption' mb={1} component='p'>
          This feature is only available for Gold tier and above. Upgrade your subscription to standardize user identity
          in your space.
        </Typography>
      </>
    );
  }

  return (
    <>
      <FieldLabel>Primary Identity</FieldLabel>
      <Typography variant='caption' mb={1} component='p'>
        Choose the primary identity for your space. This will be the required identity that your members will have to
        provide when they first join and it will be used to display the member.
      </Typography>
      <Box display='flex' alignItems='center' gap={1}>
        <Select<IdentityType | undefined>
          {...register('primaryMemberIdentity')}
          value={primaryIdentity}
          displayEmpty
          disabled={disabled}
          renderValue={(selected) => {
            return (
              <Stack flexDirection='row' alignItems='center' gap={1}>
                {selected ? (
                  <IdentityIcon size='xSmall' type={selected} />
                ) : (
                  <PersonOutlinedIcon style={{ width: 18, height: 18 }} />
                )}
                <Typography variant='body2'>{selected || "Member's choice"}</Typography>
              </Stack>
            );
          }}
        >
          <MenuItem value=''>
            <Stack flexDirection='row' alignItems='center' gap={1}>
              <PersonOutlinedIcon style={{ width: 18, height: 18 }} />
              <Typography variant='body2'>Member's choice</Typography>
            </Stack>
          </MenuItem>
          {(['Discord', 'Google', 'Telegram', 'Wallet', 'Farcaster'] as IdentityType[]).map((identity) => (
            <MenuItem key={identity} value={identity}>
              <Stack flexDirection='row' alignItems='center' gap={1}>
                <IdentityIcon size='xSmall' type={identity} />
                <Typography variant='body2'>{identity}</Typography>
              </Stack>
            </MenuItem>
          ))}
        </Select>
      </Box>
    </>
  );
}
