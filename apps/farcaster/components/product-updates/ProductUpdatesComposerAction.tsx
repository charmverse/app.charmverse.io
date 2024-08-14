'use client';

import { log } from '@charmverse/core/log';
import { FarcasterCard } from '@connect-shared/components/common/FarcasterCard';
import styled from '@emotion/styled';
import { yupResolver } from '@hookform/resolvers/yup';
import AddIcon from '@mui/icons-material/Add';
import { Button, Card, Divider, FormLabel, MenuItem, Select, TextField, Typography } from '@mui/material';
import { Stack } from '@mui/system';
import type { FarcasterUser } from '@root/lib/farcaster/getFarcasterUsers';
import { useAction } from 'next-safe-action/hooks';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';

import { postCreateCastMessage } from 'lib/postCreateCastMessage';
import { createProductUpdatesFrameAction } from 'lib/productUpdates/createProductUpdatesFrameAction';
import { schema, type FormValues } from 'lib/productUpdates/schema';
import type { ConnectProjectMinimal } from 'lib/projects/getConnectProjectsByFid';

import { CreateProjectForm } from './CreateProjectForm';

// overlay for text area to show colons
const TextFieldWithBullets = styled.div`
  position: relative;
  width: 100%;

  .MuiInputBase-root {
    padding-left: 34px;
  }

  .text-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    pointer-events: none;
    padding: 8.5px 14px;
    span {
      color: transparent;
      display: list-item;
      font-size: 1rem;
      line-height: 1.3em;
      list-style-position: inside;
      ::marker {
        color: var(--charm-palette-text-primary);
      }
    }
  }
`;

function SplitTextIntoBullets({ text }: { text: string }) {
  return text.split('\n').map((line, index) => (
    // eslint-disable-next-line react/no-array-index-key
    <span key={index}>{line}</span>
  ));
}

export function ProductUpdatesComposerAction({
  farcasterUser,
  connectProjects
}: {
  farcasterUser: FarcasterUser;
  connectProjects: ConnectProjectMinimal[];
}) {
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const locale = window.navigator.language;
  const { control, handleSubmit, reset } = useForm<FormValues>({
    defaultValues: {
      authorFid: farcasterUser.fid,
      projectId: connectProjects[0]?.id || '',
      text: '',
      createdAtLocal: new Date().toLocaleDateString(locale, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })
    },
    resolver: yupResolver(schema),
    mode: 'onChange'
  });

  const { execute, isExecuting } = useAction(createProductUpdatesFrameAction, {
    onSuccess: (data) => {
      reset();
      postCreateCastMessage({
        embeds: data.data ? [`https://${window.location.hostname}/product-updates/frames/${data.data.id}`] : [],
        text: `Product updates for ${new Date().toLocaleDateString()}`
      });
    },
    onError: (err) => {
      log.error(err.error.serverError?.message || 'Something went wrong', err.error.serverError);
    }
  });

  return (
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
        {isCreatingProject ? (
          <Stack gap={1}>
            <CreateProjectForm
              fid={farcasterUser.fid}
              onCancel={() => {
                setIsCreatingProject(false);
              }}
              onSubmit={() => {
                setIsCreatingProject(false);
              }}
            />
          </Stack>
        ) : (
          <form onSubmit={handleSubmit(execute)}>
            <Stack gap={2}>
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
                    <Divider />
                    <MenuItem
                      key='create-project'
                      onClick={() => {
                        setIsCreatingProject(true);
                      }}
                    >
                      <AddIcon sx={{ mr: 0.5 }} fontSize='small' />
                      Create project
                    </MenuItem>
                  </Select>
                )}
              />
              <Stack>
                <FormLabel id='text'>Product updates</FormLabel>
                <Controller
                  control={control}
                  name='text'
                  render={({ field, fieldState }) => (
                    <TextFieldWithBullets>
                      <TextField
                        disabled={isExecuting}
                        multiline
                        fullWidth
                        rows={8}
                        aria-labelledby='product-updates'
                        placeholder='Share the good news!'
                        // helperText='Empty lines will be ignored.'
                        error={!!fieldState.error}
                        {...field}
                      />
                      <span className='text-overlay'>
                        <SplitTextIntoBullets text={field.value} />
                      </span>
                    </TextFieldWithBullets>
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
        )}
      </Stack>
    </Stack>
  );
}
