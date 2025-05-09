import { Box, Grid, Stack, TextField, Typography } from '@mui/material';
import { isValidEmail } from '@packages/utils/strings';
import { charmBlue as blueColor } from '@packages/config/colors';
import { useEffect, useState } from 'react';
import { useFormContext } from 'react-hook-form';

import { useSendTestEmail } from 'charmClient/hooks/email';
import { Button } from 'components/common/Button';
import FieldLabel from 'components/common/form/FieldLabel';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useIsAdmin } from 'hooks/useIsAdmin';
import { useSnackbar } from 'hooks/useSnackbar';
import { useUser } from 'hooks/useUser';

import Avatar from '../../space/components/LargeAvatar';
import type { FormValues } from '../NotificationSettings';

export function SpaceEmailBrandingSettings() {
  const isAdmin = useIsAdmin();
  const {
    formState: { errors },
    register,
    watch,
    setValue
  } = useFormContext<FormValues>();
  const { user } = useUser();
  const watchEmailBrandArtwork = watch('emailBrandArtwork');
  const watchEmailBrandColor = watch('emailBrandColor');
  const [testEmail, setTestEmail] = useState('');
  const validEmail = isValidEmail(testEmail);
  const { trigger, isMutating } = useSendTestEmail();
  const { showMessage } = useSnackbar();
  const { space } = useCurrentSpace();

  function sendTestEmail() {
    if (space) {
      trigger({ email: testEmail, spaceId: space.id }).then(() => {
        showMessage('Test email sent', 'success');
      });
    }
  }

  useEffect(() => {
    if (user?.email) {
      setTestEmail(user.email);
    }
  }, [user?.email]);

  return (
    <Stack gap={2}>
      <Grid item>
        <FieldLabel>Email Logo</FieldLabel>
        <Typography variant='caption' mb={2} component='p'>
          Add a custom logo for your email notifications (recommended max height: 250px)
        </Typography>
        <Avatar
          accept='image/jpeg, image/png, image/gif, image/webp'
          name='C'
          variant='rounded'
          image={watchEmailBrandArtwork}
          updateImage={(url: string) => setValue('emailBrandArtwork', url, { shouldDirty: true, shouldTouch: true })}
          editable={isAdmin}
        />
        <TextField {...register('emailBrandArtwork')} sx={{ visibility: 'hidden', width: '0px', height: '0px' }} />
      </Grid>
      <Grid item>
        <FieldLabel>Email Color</FieldLabel>
        <Typography variant='caption' mb={1} component='p'>
          Select the primary color for your email notifications
        </Typography>
        <Stack direction='row' alignItems='flex-start' gap={1}>
          <TextField
            value={watchEmailBrandColor}
            onChange={(e) => setValue('emailBrandColor', e.target.value, { shouldDirty: true, shouldValidate: true })}
            disabled={!isAdmin}
            fullWidth
            error={!!errors.emailBrandColor}
            helperText={errors.emailBrandColor?.message}
            placeholder={blueColor}
          />
          <Box
            sx={{
              border: (theme) => `1px solid ${theme.palette.divider}`,
              width: '40px',
              height: '40px',
              borderRadius: (theme) => theme.spacing(0.5),
              backgroundColor: watchEmailBrandColor
            }}
          />
        </Stack>
      </Grid>
      <Grid item>
        <FieldLabel>Send a test email</FieldLabel>
        <Typography variant='caption' mb={1} component='p'>
          Preview your logo and color with a test email.
        </Typography>
        <Stack direction='row' alignItems='flex-start' gap={1}>
          <TextField
            value={isAdmin ? testEmail : ''}
            onChange={(e) => {
              setTestEmail(e.target.value);
            }}
            disabled={!isAdmin || isMutating}
            fullWidth
            error={testEmail !== '' && !validEmail}
            placeholder='test@gmail.com'
          />
          <Button loading={isMutating} disabled={!validEmail || !isAdmin} primary onClick={sendTestEmail}>
            Test
          </Button>
        </Stack>
      </Grid>
    </Stack>
  );
}
