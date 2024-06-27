import { Avatar } from '@connect/components/common/Avatar';
import { useS3UploadInput } from '@connect/hooks/useS3UploadInput';
import type { FormValues } from '@connect/lib/projects/form';
import { CATEGORIES } from '@connect/lib/projects/form';
import { inputBackground } from '@connect/theme/colors';
import AddIcon from '@mui/icons-material/AddOutlined';
import DeleteIcon from '@mui/icons-material/DeleteOutline';
import { Button, FormLabel, IconButton, MenuItem, Select, Stack, TextField, Typography } from '@mui/material';
import CircularProgress from '@mui/material/CircularProgress';
import Link from 'next/link';
import type { Control, FieldArrayPath } from 'react-hook-form';
import { Controller, useController, useFieldArray } from 'react-hook-form';

function MultiTextValueFields({
  control,
  label,
  name,
  placeholder
}: {
  control: Control<FormValues>;
  name: keyof FormValues;
  label: string;
  placeholder: string;
}) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: name as FieldArrayPath<FormValues>
  });

  return (
    <Stack>
      <FormLabel id={`project-${name.toLowerCase().replaceAll(' ', '')}`}>{label}</FormLabel>
      <Controller
        control={control}
        name={`${name}.0` as FieldArrayPath<FormValues>}
        render={({ field: _field, fieldState }) => (
          <TextField
            fullWidth
            aria-labelledby={`project-${name}-0`}
            placeholder={placeholder}
            error={!!fieldState.error}
            sx={{ mb: 1 }}
            {..._field}
          />
        )}
      />
      {fields.slice(1).map((field, index) => (
        <Stack key={field.id} gap={1} mb={1} direction='row'>
          <Controller
            control={control}
            name={`${name}.${index + 1}` as FieldArrayPath<FormValues>}
            render={({ field: _field, fieldState }) => (
              <Stack width='100%' gap={1} alignItems='center' flexDirection='row'>
                <TextField
                  fullWidth
                  aria-labelledby={`project-${name}-${index + 1}`}
                  placeholder={placeholder}
                  error={!!fieldState.error}
                  {..._field}
                />
                <IconButton size='small'>
                  <DeleteIcon fontSize='small' color='error' onClick={() => remove(index + 1)} />
                </IconButton>
              </Stack>
            )}
          />
        </Stack>
      ))}
      <Button
        sx={{
          width: 'fit-content'
        }}
        startIcon={<AddIcon fontSize='small' />}
        size='small'
        variant='outlined'
        color='secondary'
        onClick={() => {
          append('' as any);
        }}
      >
        Add
      </Button>
    </Stack>
  );
}

function ImageField({
  control,
  name,
  type
}: {
  type: 'avatar' | 'cover';
  control: Control<FormValues>;
  name: keyof FormValues;
}) {
  const { field } = useController({
    name,
    control
  });

  const { inputRef, isUploading, onFileChange } = useS3UploadInput({
    onFileUpload: ({ url }) => {
      field.onChange(url);
    }
  });

  return (
    <Controller
      name='avatar'
      control={control}
      render={() => (
        <div
          style={{
            position: 'relative',
            width: type === 'avatar' ? 125 : '100%',
            height: 96
          }}
        >
          <input
            disabled={isUploading}
            type='file'
            accept={'image/*'}
            ref={inputRef}
            onChange={onFileChange}
            style={{
              width: '100%',
              height: '100%',
              position: 'absolute',
              top: 0,
              opacity: 0,
              zIndex: 1,
              cursor: 'pointer'
            }}
          />
          {isUploading ? (
            <Stack
              sx={{
                backgroundColor: inputBackground,
                width: '100%',
                height: '100%',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                borderRadius: type === 'avatar' ? '50%' : 0
              }}
            >
              <CircularProgress color='secondary' size={50} />
            </Stack>
          ) : type === 'avatar' ? (
            <Avatar
              size='xLarge'
              avatar={field.value as string}
              sx={{
                backgroundColor: !field.value ? inputBackground : undefined
              }}
            />
          ) : (
            <img
              src={field.value as string}
              style={{
                width: '100%',
                height: '100%',
                background: inputBackground,
                objectFit: 'cover',
                objectPosition: 'center'
              }}
            />
          )}
        </div>
      )}
    />
  );
}

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
          <ImageField name='cover' type='cover' control={control} />
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
