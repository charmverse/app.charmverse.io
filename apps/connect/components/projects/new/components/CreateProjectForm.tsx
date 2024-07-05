import type { FormValues } from '@connect/lib/projects/form';
import { CATEGORIES } from '@connect/lib/projects/form';
import { Button, FormLabel, MenuItem, Select, Stack, TextField, Typography } from '@mui/material';
import Link from 'next/link';
import type { Control } from 'react-hook-form';
import { Controller } from 'react-hook-form';

import { ImageField } from './ImageField';
import { MultiTextValueFields } from './MultiTextValueFields';

export function CreateProjectForm({
  control,
  isValid,
  onNext
}: {
  control: Control<FormValues>;
  isValid: boolean;
  onNext: VoidFunction;
}) {
  return (
    <Stack gap={2}>
      <Stack>
        <FormLabel required id='project-name'>
          Name
        </FormLabel>
        <Controller
          control={control}
          name='name'
          render={({ field, fieldState }) => (
            <TextField
              autoFocus
              placeholder='Acme Inc.'
              aria-labelledby='project-name'
              error={!!fieldState.error}
              {...field}
            />
          )}
        />
      </Stack>
      <Stack>
        <FormLabel id='project-description'>Description</FormLabel>
        <Controller
          control={control}
          name='description'
          render={({ field }) => (
            <TextField
              multiline
              rows={3}
              aria-labelledby='project-description'
              placeholder='A description of your project'
              {...field}
            />
          )}
        />
      </Stack>
      <Stack>
        <FormLabel id='project-avatar-and-cover-image'>Project avatar and cover image</FormLabel>
        <Stack direction='row' gap={1}>
          <ImageField type='avatar' name='avatar' control={control} />
          <ImageField type='cover' name='coverImage' control={control} />
        </Stack>
      </Stack>
      <Stack>
        <FormLabel id='project-category'>Category</FormLabel>
        <Controller
          control={control}
          name='category'
          render={({ field, fieldState }) => (
            <Select
              displayEmpty
              fullWidth
              aria-labelledby='project-category'
              renderValue={(value) => value || <Typography color='secondary'>Select a category</Typography>}
              error={!!fieldState.error}
              {...field}
            >
              {CATEGORIES.map((category) => (
                <MenuItem key={category} value={category}>
                  {category}
                </MenuItem>
              ))}
            </Select>
          )}
        />
      </Stack>
      <MultiTextValueFields control={control} name='websites' label='Websites' placeholder='https://acme-inc.com' />
      <MultiTextValueFields
        control={control}
        name='farcasterIds'
        label='Farcaster'
        placeholder='https://warpcast.xyz/acme-inc'
      />
      <Stack>
        <FormLabel id='project-twitter'>X</FormLabel>
        <Controller
          control={control}
          name='twitter'
          render={({ field, fieldState }) => (
            <TextField
              placeholder='https://twitter.com/acme-inc'
              aria-labelledby='project-twitter'
              error={!!fieldState.error}
              {...field}
            />
          )}
        />
      </Stack>
      <Stack>
        <FormLabel id='project-github'>Github</FormLabel>
        <Controller
          control={control}
          name='github'
          render={({ field, fieldState }) => (
            <TextField
              placeholder='https://github.com/acme-inc'
              aria-labelledby='project-github'
              error={!!fieldState.error}
              {...field}
            />
          )}
        />
      </Stack>
      <Stack>
        <FormLabel id='project-mirror'>Mirror</FormLabel>
        <Controller
          control={control}
          name='mirror'
          render={({ field, fieldState }) => (
            <TextField
              placeholder='https://mirror.xyz/acme-inc'
              aria-labelledby='project-mirror'
              error={!!fieldState.error}
              {...field}
            />
          )}
        />
      </Stack>
      <Stack justifyContent='space-between' flexDirection='row'>
        <Link href='/profile' passHref>
          <Button size='large' color='secondary' variant='outlined'>
            Cancel
          </Button>
        </Link>
        <Button size='large' disabled={!isValid} onClick={onNext}>
          Next
        </Button>
      </Stack>
    </Stack>
  );
}
