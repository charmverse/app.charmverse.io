import { ImageField } from '@connect-shared/components/common/ImageField';
import { MultiTextInputField } from '@connect-shared/components/common/MultiTextInputField';
import { FormLabel, Stack, TextField, Typography } from '@mui/material';
import type { Control } from 'react-hook-form';
import { Controller } from 'react-hook-form';

import type { FormValues } from 'lib/projects/projectSchema';

export function ProjectForm({ control }: { control: Control<FormValues> }) {
  return (
    <Stack gap={2}>
      <Stack>
        <FormLabel>Project avatar and cover image</FormLabel>
        <Stack direction='row' gap={1}>
          <ImageField type='avatar' name='avatar' control={control} />
          <ImageField type='cover' name='coverImage' control={control} />
        </Stack>
      </Stack>
      <Stack>
        <FormLabel required>Name</FormLabel>
        <Controller
          control={control}
          name='name'
          render={({ field, fieldState }) => (
            <TextField
              data-test='project-form-name'
              autoFocus
              placeholder='Charmverse'
              aria-labelledby='project-name'
              error={!!fieldState.error}
              helperText={fieldState.error?.message}
              {...field}
            />
          )}
        />
      </Stack>
      <Stack>
        <FormLabel>Description</FormLabel>
        <Controller
          control={control}
          name='description'
          render={({ field }) => (
            <TextField
              data-test='project-form-description'
              multiline
              rows={3}
              aria-labelledby='project-description'
              placeholder='A description of your project'
              {...field}
            />
          )}
        />
      </Stack>

      <MultiTextInputField
        control={control}
        name='websites'
        label='Websites'
        data-test='project-form-websites'
        placeholder='https://charmverse.io'
      />

      <MultiTextInputField
        control={control}
        name='farcasterValues'
        label='Farcaster'
        data-test='project-form-farcaster-values'
        placeholder='https://warpcast.com/charmverse'
      />

      <Stack>
        <FormLabel>X</FormLabel>
        <Stack direction='row' gap={1} alignItems='center'>
          <Typography color='secondary' width={250}>
            https://x.com/
          </Typography>
          <Controller
            control={control}
            name='twitter'
            render={({ field, fieldState }) => (
              <TextField
                fullWidth
                placeholder='charmverse'
                data-test='project-form-twitter'
                aria-labelledby='project-twitter'
                error={!!fieldState.error}
                {...field}
              />
            )}
          />
        </Stack>
      </Stack>
      <Stack>
        <FormLabel>Github</FormLabel>
        <Stack direction='row' gap={1} alignItems='center'>
          <Typography color='secondary' width={250}>
            https://github.com/
          </Typography>
          <Controller
            control={control}
            name='github'
            render={({ field, fieldState }) => (
              <TextField
                fullWidth
                placeholder='charmverse'
                aria-labelledby='project-github'
                data-test='project-form-github'
                error={!!fieldState.error}
                {...field}
              />
            )}
          />
        </Stack>
      </Stack>
    </Stack>
  );
}
