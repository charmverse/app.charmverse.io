import type { SunnyAwardsProjectType } from '@charmverse/core/prisma-client';
import { ProjectBlockchainSelect } from '@connect-shared/components/form/BlockchainSelect';
import { Button, FormLabel, MenuItem, Select, Stack, TextField, Typography } from '@mui/material';
import { capitalize } from '@root/lib/utils/strings';
import Link from 'next/link';
import type { Control } from 'react-hook-form';
import { Controller } from 'react-hook-form';

import { CATEGORIES, SUNNY_AWARD_CATEGORIES } from 'lib/projects/form';
import type { FormValues } from 'lib/projects/form';

import { ProjectImageField } from './ProjectImageField';
import { ProjectMultiTextValueFields } from './ProjectMultiTextValueFields';

export function ProjectForm({
  control,
  isValid,
  onNext
}: {
  control: Control<FormValues>;
  isValid: boolean;
  onNext: VoidFunction;
}) {
  const sunnyAwardsProjectType = control._formValues.sunnyAwardsProjectType as SunnyAwardsProjectType | undefined;

  const form = 3;
  // Tests

  return (
    <>
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
                data-test='project-form-name'
                autoFocus
                placeholder='Charmverse'
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
        <Stack>
          <FormLabel id='project-sunnyaward-type'>Sunny Awards Project Type</FormLabel>
          <Controller
            control={control}
            name='sunnyAwardsProjectType'
            render={({ field, fieldState }) => (
              <Select
                displayEmpty
                fullWidth
                aria-labelledby='project-category'
                data-test='project-form-category'
                renderValue={(value) =>
                  value ? capitalize(value) : <Typography color='secondary'>Select a category</Typography>
                }
                error={!!fieldState.error}
                {...field}
              >
                {SUNNY_AWARD_CATEGORIES.map((category) => (
                  <MenuItem key={category} value={category}>
                    {capitalize(category)}
                  </MenuItem>
                ))}
              </Select>
            )}
          />
        </Stack>
        {sunnyAwardsProjectType === 'app' && (
          <Stack>
            <FormLabel id='project-chain'>Project Chain ID</FormLabel>
            <ProjectBlockchainSelect />

            <FormLabel id='project-contract'>Project Contract Address</FormLabel>
            <Controller
              control={control}
              name='primaryContractAddress'
              render={({ field }) => (
                <TextField
                  data-test='project-contract'
                  rows={3}
                  aria-labelledby='project-contract'
                  placeholder='A description of your project'
                  {...field}
                />
              )}
            />
          </Stack>
        )}
        {sunnyAwardsProjectType === 'creator' && (
          <Stack>
            <FormLabel id='project-description'>Creator minting wallet address</FormLabel>
            <Controller
              control={control}
              name='description'
              render={({ field }) => (
                <TextField
                  data-test='project-form-description'
                  rows={3}
                  aria-labelledby='project-description'
                  placeholder='Wallet used to mint the project'
                  {...field}
                />
              )}
            />
          </Stack>
        )}
        <Stack>
          <FormLabel id='project-avatar-and-cover-image'>Project avatar and cover image</FormLabel>
          <Stack direction='row' gap={1}>
            <ProjectImageField type='avatar' name='avatar' control={control} />
            <ProjectImageField type='cover' name='coverImage' control={control} />
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
                data-test='project-form-category'
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
        <ProjectMultiTextValueFields
          control={control}
          name='websites'
          label='Websites'
          dataTest='project-form-websites'
          placeholder='https://charmverse.io'
        />
        <ProjectMultiTextValueFields
          control={control}
          name='farcasterValues'
          label='Farcaster'
          dataTest='project-form-farcaster-values'
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
        <Stack>
          <FormLabel id='project-mirror'>Mirror</FormLabel>
          <Stack direction='row' gap={1} alignItems='center'>
            <Typography color='secondary' width={250}>
              https://mirror.xyz/
            </Typography>
            <Controller
              control={control}
              name='mirror'
              render={({ field, fieldState }) => (
                <TextField
                  fullWidth
                  placeholder='charmverse'
                  aria-labelledby='project-mirror'
                  data-test='project-form-mirror'
                  error={!!fieldState.error}
                  {...field}
                />
              )}
            />
          </Stack>
        </Stack>
      </Stack>
      <Stack
        justifyContent='space-between'
        flexDirection='row'
        display='sticky'
        bottom='0'
        bgcolor='background.default'
        py={2}
      >
        <Link href='/profile' passHref>
          <Button size='large' color='secondary' variant='outlined'>
            Cancel
          </Button>
        </Link>
        <Button data-test='project-form-confirm-values' size='large' disabled={!isValid} onClick={onNext}>
          Next
        </Button>
      </Stack>
    </>
  );
}
