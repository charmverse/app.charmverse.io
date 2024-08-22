'use client';

import { LoadingComponent } from '@connect-shared/components/common/Loading/LoadingComponent';
import { MultiTextInputField } from '@connect-shared/components/common/MultiTextInputField';
import { FormErrors } from '@connect-shared/components/project/FormErrors';
import type { LoggedInUser } from '@connect-shared/lib/profile/getCurrentUserAction';
import { Box, Button, FormLabel, ListSubheader, MenuItem, Select, Stack, TextField, Typography } from '@mui/material';
import { capitalize } from '@root/lib/utils/strings';
import Link from 'next/link';
import type { Control } from 'react-hook-form';
import { Controller, useController } from 'react-hook-form';

import type { FormValues } from 'lib/projects/schema';
import { PROJECT_CATEGORIES, PROJECT_TYPES } from 'lib/projects/schema';

import { AddProjectMembersForm } from './AddProjectMembersForm';
import { BlockchainSelect } from './BlockchainSelect';
import { ProjectImageField } from './ProjectImageField';

export function ProjectForm({
  control,
  isExecuting,
  user,
  errors,
  submitLabel
}: {
  control: Control<FormValues>;
  isExecuting: boolean;
  user: LoggedInUser;
  errors: string[] | null;
  submitLabel: string;
}) {
  const { field: sunnyAwardsProjectTypeField } = useController({ name: 'sunnyAwardsProjectType', control });
  const sunnyAwardsProjectType = sunnyAwardsProjectTypeField.value;

  return (
    <>
      <Stack mb={2}>
        <FormLabel id='project-avatar-and-cover-image'>Project avatar and cover image</FormLabel>
        <Stack direction='row' gap={1}>
          <ProjectImageField type='avatar' name='avatar' control={control} />
          <ProjectImageField type='cover' name='coverImage' control={control} />
        </Stack>
      </Stack>
      <Stack gap={2} mb={2}>
        <Stack>
          <FormLabel required id='project-name'>
            Name
          </FormLabel>
          <Controller
            control={control}
            name='name'
            render={({ field, fieldState }) => (
              <TextField
                data-test='project-form-name'
                autoFocus
                placeholder='Charmverse'
                aria-labelledby='project-name'
                {...field}
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
              />
            )}
          />
        </Stack>
        <Stack>
          <FormLabel required id='project-description'>
            Description
          </FormLabel>
          <Controller
            control={control}
            name='description'
            render={({ field, fieldState }) => (
              <TextField
                data-test='project-form-description'
                multiline
                rows={3}
                aria-labelledby='project-description'
                placeholder='A description of your project'
                {...field}
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
              />
            )}
          />
        </Stack>
        <Stack>
          <FormLabel id='project-sunnyaward-type' required>
            SUNNY Awards Project Type
          </FormLabel>
          <Controller
            control={control}
            name='sunnyAwardsProjectType'
            render={({ field, fieldState }) => (
              <Select
                displayEmpty
                fullWidth
                aria-labelledby='project-sunny-category'
                data-test='project-sunny-category'
                renderValue={(value) =>
                  value ? capitalize(value) : <Typography color='secondary'>Select a category</Typography>
                }
                {...field}
                error={!!fieldState.error}
              >
                {PROJECT_TYPES.map((category) => (
                  <MenuItem key={category} value={category}>
                    {capitalize(category)}
                  </MenuItem>
                ))}
              </Select>
            )}
          />
        </Stack>
        {sunnyAwardsProjectType === 'app' && (
          <Stack gap={2}>
            <Stack>
              <FormLabel id='project-chain' required>
                Project Chain
              </FormLabel>
              <Controller
                control={control}
                name='primaryContractChainId'
                render={({ field }) => <BlockchainSelect {...field} value={field.value} onChange={field.onChange} />}
              />
            </Stack>
            <Stack>
              <FormLabel id='project-contract' required>
                Project Contract Address
              </FormLabel>
              <Controller
                control={control}
                name='primaryContractAddress'
                render={({ field, fieldState }) => (
                  <TextField
                    data-test='project-contract'
                    rows={3}
                    aria-labelledby='project-contract'
                    placeholder='Contract address'
                    {...field}
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                  />
                )}
              />
            </Stack>
          </Stack>
        )}
        {sunnyAwardsProjectType === 'creator' && (
          <Stack>
            <FormLabel id='project-minting-wallet' required>
              Creator minting wallet address
            </FormLabel>
            <Controller
              control={control}
              name='mintingWalletAddress'
              render={({ field, fieldState }) => (
                <TextField
                  data-test='project-minting-wallet'
                  rows={3}
                  aria-labelledby='project-minting-wallet'
                  placeholder='Wallet used to mint the project'
                  {...field}
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                />
              )}
            />
          </Stack>
        )}
        <MultiTextInputField
          required
          control={control}
          name='websites'
          label='Websites'
          data-test='project-form-websites'
          placeholder='https://charmverse.io'
        />
        <Stack>
          <FormLabel id='project-category' required>
            Category
          </FormLabel>
          <Controller
            control={control}
            name='sunnyAwardsCategory'
            render={({ field, fieldState }) => (
              <Select
                displayEmpty
                fullWidth
                aria-labelledby='project-category'
                data-test='project-form-category'
                renderValue={(value) => value || <Typography color='secondary'>Select a category</Typography>}
                error={!!fieldState.error}
                {...field}
              >
                {PROJECT_CATEGORIES.map(({ group, items }) => [
                  <ListSubheader key={group}>{group}</ListSubheader>,
                  ...items.map((category) => (
                    <MenuItem key={category} value={category} sx={{ pl: 5 }}>
                      {category}
                    </MenuItem>
                  ))
                ])}
              </Select>
            )}
          />
        </Stack>

        <MultiTextInputField
          control={control}
          name='farcasterValues'
          label='Farcaster'
          data-test='project-form-farcaster-values'
          placeholder='https://warpcast.com/charmverse'
        />

        <Stack>
          <FormLabel id='project-twitter'>X</FormLabel>
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
          <FormLabel id='project-github'>Github</FormLabel>
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
      <AddProjectMembersForm user={user} control={control} disabled={isExecuting} />
      <Stack direction='row' justifyContent='space-between' gap={2}>
        <Button LinkComponent={Link} href='/profile' variant='outlined' color='secondary' sx={{ flexShrink: 0 }}>
          Cancel
        </Button>
        {isExecuting && (
          <Box display='flex' justifyContent='flex-end'>
            <LoadingComponent
              height={20}
              size={20}
              minHeight={20}
              label='Submitting your project onchain'
              flexDirection='row-reverse'
            />
          </Box>
        )}
        {!isExecuting && errors?.length && (
          <Box display={{ xs: 'none', md: 'block' }} flexGrow={0}>
            <FormErrors errors={errors} />
          </Box>
        )}
        <Button data-test='project-form-publish' disabled={isExecuting} type='submit' sx={{ flexShrink: 0 }}>
          {submitLabel}
        </Button>
      </Stack>
      {!isExecuting && errors && (
        <Box display={{ md: 'none' }} mt={2}>
          <FormErrors errors={errors} />
        </Box>
      )}
    </>
  );
}
