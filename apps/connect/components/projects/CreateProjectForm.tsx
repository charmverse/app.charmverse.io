import { yupResolver } from '@hookform/resolvers/yup';
import AddIcon from '@mui/icons-material/AddOutlined';
import DeleteIcon from '@mui/icons-material/DeleteOutline';
import { Button, FormLabel, IconButton, MenuItem, Select, Stack, TextField, Typography } from '@mui/material';
import type { Control, FieldArrayPath } from 'react-hook-form';
import { Controller, useController, useFieldArray, useForm } from 'react-hook-form';

import { Avatar } from 'components/common/Avatar';
import { useS3UploadInput } from 'hooks/useS3UploadInput';
import { actionCreateProject } from 'lib/projects/createProjectAction';
import { ResizeType } from 'lib/utils/file';
import { inputBackground } from 'theme/colors';

import { CATEGORIES } from './utils/constants';
import type { FormValues } from './utils/form';
import { schema } from './utils/form';

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
          append('');
        }}
      >
        Add
      </Button>
    </Stack>
  );
}

function AvatarField({ control }: { control: Control<FormValues> }) {
  const { field } = useController({
    name: 'avatar',
    control
  });

  const { inputRef, isUploading, onFileChange } = useS3UploadInput({
    onFileUpload: ({ url }) => {
      field.onChange(url);
    },
    resizeType: ResizeType.Artwork
  });

  return (
    <Controller
      name='avatar'
      control={control}
      render={() => (
        <div
          style={{
            position: 'relative'
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
          <Avatar
            size='xLarge'
            avatar={field.value}
            sx={{
              backgroundColor: !field.value ? inputBackground : undefined
            }}
          />
        </div>
      )}
    />
  );
}

function CoverImageField({ control }: { control: Control<FormValues> }) {
  const { field } = useController({
    name: 'cover',
    control
  });

  const { inputRef, isUploading, onFileChange } = useS3UploadInput({
    onFileUpload: ({ url }) => {
      field.onChange(url);
    },
    resizeType: ResizeType.Artwork
  });

  return (
    <Controller
      name='cover'
      control={control}
      render={() => (
        <div
          style={{
            width: '100%',
            height: 96,
            position: 'relative'
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
          <img
            src={field.value}
            style={{
              width: '100%',
              height: '100%',
              background: inputBackground
            }}
          />
        </div>
      )}
    />
  );
}

export function CreateProjectForm({ onCancel }: { onCancel: VoidFunction }) {
  const {
    control,
    formState: { isValid },
    handleSubmit,
    getValues
  } = useForm({
    defaultValues: {},
    resolver: yupResolver(schema),
    mode: 'onChange'
  });

  return (
    <>
      <Typography variant='h5'>Create a Project</Typography>
      <form
        action={actionCreateProject}
        onSubmit={() => {
          handleSubmit(() => {
            actionCreateProject({ parsedInput: getValues(), ctx: {} });
          });
        }}
      >
        <Stack gap={2}>
          <Stack>
            <FormLabel id='project-name'>Name</FormLabel>
            <Controller
              control={control}
              name='name'
              render={({ field, fieldState }) => (
                <TextField
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
              <AvatarField control={control} />
              <CoverImageField control={control} />
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
            placeholder='https://farcaster.xyz'
          />
          <Stack>
            <FormLabel id='project-twitter'>X.com</FormLabel>
            <Controller
              control={control}
              name='twitter'
              render={({ field, fieldState }) => (
                <TextField
                  placeholder='https://x.com/acme-inc'
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
            <Button color='error' variant='outlined' onClick={onCancel}>
              Cancel
            </Button>
            <Button type='submit' disabled={!isValid}>
              Next
            </Button>
          </Stack>
        </Stack>
      </form>
    </>
  );
}
