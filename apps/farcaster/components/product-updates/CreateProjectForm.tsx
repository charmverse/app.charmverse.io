'use client';

import { log } from '@charmverse/core/log';
import { ProjectForm } from '@connect-shared/components/project/ProjectForm';
import { schema, type FormValues } from '@connect-shared/lib/projects/form';
import { yupResolver } from '@hookform/resolvers/yup';
import { Button, Stack } from '@mui/material';
import { useAction } from 'next-safe-action/hooks';
import { useForm } from 'react-hook-form';

import { createProjectAction } from 'lib/projects/createProjectAction';

export function CreateProjectForm({
  fid,
  onCancel,
  onSubmit
}: {
  onSubmit: VoidFunction;
  fid: number;
  onCancel: VoidFunction;
}) {
  const { execute, isExecuting } = useAction(createProjectAction, {
    onError(err) {
      log.error(err.error.serverError?.message || 'Something went wrong', err.error.serverError);
    }
  });

  const { control, handleSubmit } = useForm<FormValues>({
    defaultValues: {
      name: '',
      projectMembers: [
        {
          farcasterId: fid
        }
      ]
    },
    resolver: yupResolver(schema),
    mode: 'onChange'
  });

  return (
    <>
      <ProjectForm
        control={control}
        // TODO: Implement function to get upload token
        uploadImageFn={() =>
          new Promise((resolve) => {
            resolve({
              token: 'token',
              region: 'region',
              bucket: 'bucket',
              key: 'key'
            });
          })
        }
      />
      <Stack
        justifyContent='space-between'
        flexDirection='row'
        position='sticky'
        bottom='0'
        bgcolor='background.default'
        py={2}
      >
        <Button onClick={onCancel} size='large' color='secondary' variant='outlined'>
          Cancel
        </Button>
        <Button
          data-test='project-form-confirm-values'
          size='large'
          disabled={isExecuting}
          onClick={handleSubmit((values) => {
            execute(values);
            onSubmit();
          })}
        >
          Create
        </Button>
      </Stack>
    </>
  );
}
