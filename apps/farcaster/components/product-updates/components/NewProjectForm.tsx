'use client';

import { log } from '@charmverse/core/log';
import { yupResolver } from '@hookform/resolvers/yup';
import { Button, FormLabel, Stack, TextField, Typography } from '@mui/material';
import { FormErrors } from '@packages/connect-shared/components/common/FormErrors';
import { ImageField } from '@packages/connect-shared/components/common/ImageField';
import { concatenateStringValues } from '@root/lib/utils/strings';
import { useAction } from 'next-safe-action/hooks';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';

import { createProjectAction } from 'lib/projects/createProjectAction';
import type { FormValues } from 'lib/projects/projectSchema';
import { schema } from 'lib/projects/projectSchema';

export function NewProjectForm({
  fid,
  onCancel,
  onSubmit
}: {
  onSubmit: (projectId: string) => void;
  fid: number;
  onCancel: VoidFunction;
}) {
  const [errors, setErrors] = useState<string[] | null>(null);
  const { execute, isExecuting } = useAction(createProjectAction, {
    onError(err) {
      const hasValidationErrors = err.error.validationErrors?.fieldErrors;
      const errorMessage = hasValidationErrors
        ? concatenateStringValues(err.error.validationErrors!.fieldErrors)
        : err.error.serverError?.message || 'Something went wrong';

      setErrors(errorMessage instanceof Array ? errorMessage : [errorMessage]);
      log.error(err.error.serverError?.message || 'Something went wrong', err.error.serverError);
    },
    onSuccess(data) {
      if (data.data) {
        onSubmit(data.data.id);
      }
    }
  });

  const { control, handleSubmit } = useForm<FormValues>({
    defaultValues: {
      name: '',
      avatar: '',
      teamLeadFarcasterId: fid
    },
    resolver: yupResolver(schema),
    mode: 'onChange'
  });

  return (
    <form noValidate onSubmit={handleSubmit(execute)}>
      <Typography variant='h5'>Create a project</Typography>
      <Stack gap={2}>
        <Stack>
          <FormLabel required>New project name</FormLabel>
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
          <FormLabel>Project avatar</FormLabel>
          <Stack direction='row' gap={1}>
            <ImageField type='avatar' name='avatar' control={control} />
          </Stack>
        </Stack>
      </Stack>
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
        {!isExecuting && errors?.length && <FormErrors errors={errors} />}
        <Button size='large' type='submit' disabled={isExecuting}>
          Create
        </Button>
      </Stack>
    </form>
  );
}
