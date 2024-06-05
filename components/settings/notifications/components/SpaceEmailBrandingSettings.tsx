import { Box, Grid, Stack, TextField, Typography } from '@mui/material';
import { useFormContext } from 'react-hook-form';

import FieldLabel from 'components/common/form/FieldLabel';
import { useIsAdmin } from 'hooks/useIsAdmin';
import { blueColor } from 'theme/colors';

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
  const watchEmailBrandArtwork = watch('emailBrandArtwork');
  const watchEmailBrandColor = watch('emailBrandColor');

  return (
    <>
      <Grid item>
        <FieldLabel>Email Brand Image</FieldLabel>
        <Typography variant='caption' mb={2} component='p'>
          Customize the image shown in email.
        </Typography>
        <Avatar
          name='C'
          variant='rounded'
          image={watchEmailBrandArtwork}
          updateImage={(url: string) => setValue('emailBrandArtwork', url, { shouldDirty: true })}
          editable={isAdmin}
        />
        <TextField {...register('emailBrandArtwork')} sx={{ visibility: 'hidden', width: '0px', height: '0px' }} />
      </Grid>
      <Grid item>
        <FieldLabel>Email Brand Color</FieldLabel>
        <Typography variant='caption' mb={2} component='p'>
          Customize the color shown in email.
        </Typography>
        <Stack direction='row' alignItems='center' gap={1}>
          <TextField
            {...register('emailBrandColor')}
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
              backgroundColor: watchEmailBrandColor?.startsWith('#') ? watchEmailBrandColor : `#${watchEmailBrandColor}`
            }}
          />
        </Stack>
      </Grid>
    </>
  );
}
