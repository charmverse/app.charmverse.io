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
        <FieldLabel>Email Logo</FieldLabel>
        <Typography variant='caption' mb={2} component='p'>
          Add a custom logo for your email notifications
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
        <Typography variant='caption' mb={2} component='p'>
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
    </>
  );
}
