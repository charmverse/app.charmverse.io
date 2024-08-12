'use client';

import { log } from '@charmverse/core/log';
import { FarcasterCard } from '@connect-shared/components/common/FarcasterCard';
import { yupResolver } from '@hookform/resolvers/yup';
import { Button, Card, FormLabel, MenuItem, Select, TextField, Typography } from '@mui/material';
import { Stack } from '@mui/system';
import type { FarcasterUser } from '@root/lib/farcaster/getFarcasterUsers';
import { useAction } from 'next-safe-action/hooks';
import { Controller, useForm } from 'react-hook-form';

import type { ConnectProjectMinimal } from 'lib/getConnectProjectsByFid';
import { postCreateCastMessage } from 'lib/postCreateCastMessage';
import { createProductUpdatesFrameAction } from 'lib/productUpdates/createProductUpdatesFrameAction';
import { schema, type FormValues } from 'lib/productUpdates/schema';

export function ProductUpdatesComposerAction({
  farcasterUser,
  connectProjects
}: {
  farcasterUser: FarcasterUser;
  connectProjects: ConnectProjectMinimal[];
}) {
  const { control, handleSubmit, reset } = useForm<FormValues>({
    defaultValues: {
      authorFid: farcasterUser.fid,
      projectId: '',
      text: '',
      createdAtLocal: new Date().toDateString()
    },
    resolver: yupResolver(schema),
    mode: 'onChange'
  });

  const { execute, isExecuting } = useAction(createProductUpdatesFrameAction, {
    onSuccess: (data) => {
      reset();
      postCreateCastMessage({
        embeds: data.data ? [data.data.image] : [],
        text: `Product updates for ${new Date().toLocaleDateString()}`
      });
    },
    onError: (err) => {
      log.error(err.error.serverError?.message || 'Something went wrong', err.error.serverError);
    }
  });

  return (
    <form onSubmit={handleSubmit(execute)}>
      <Stack gap={2}>
        <Card>
          <FarcasterCard
            fid={farcasterUser.fid}
            name={farcasterUser.display_name}
            username={farcasterUser.username}
            avatar={farcasterUser.pfp_url}
            bio={farcasterUser.profile.bio.text}
          />
        </Card>
        <Stack>
          <FormLabel id='projectId'>Project</FormLabel>
          <Controller
            control={control}
            name='projectId'
            render={({ field, fieldState }) => (
              <Select
                displayEmpty
                fullWidth
                disabled={isExecuting}
                renderValue={(value) => {
                  if (value) {
                    return connectProjects.find((project) => project.id === value)?.name;
                  }
                  return <Typography color='secondary'>Select a project</Typography>;
                }}
                error={!!fieldState.error}
                {...field}
              >
                {connectProjects.map((connectProject) => (
                  <MenuItem key={connectProject.id} value={connectProject.id}>
                    {connectProject.name}
                  </MenuItem>
                ))}
              </Select>
            )}
          />
        </Stack>

        <Stack>
          <FormLabel id='text'>Product updates</FormLabel>
          <Controller
            control={control}
            name='text'
            render={({ field, fieldState }) => (
              <TextField
                disabled={isExecuting}
                multiline
                rows={8}
                aria-labelledby='product-updates'
                placeholder='1. Updated documentation ...'
                helperText='Provide a list of your product updates on each line. Empty lines will be ignored.'
                error={!!fieldState.error}
                {...field}
              />
            )}
          />
        </Stack>

        <Stack alignItems='flex-end'>
          <Button
            type='submit'
            size='large'
            sx={{
              width: 'fit-content'
            }}
            variant='contained'
            disabled={isExecuting}
          >
            Submit
          </Button>
        </Stack>
      </Stack>
    </form>
  );
}
