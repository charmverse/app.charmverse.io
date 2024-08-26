'use client';

import { log } from '@charmverse/core/log';
import { FormErrors } from '@connect-shared/components/common/FormErrors';
import { yupResolver } from '@hookform/resolvers/yup';
import { Button, Stack } from '@mui/material';
import { concatenateStringValues } from '@root/lib/utils/strings';
import { useAction } from 'next-safe-action/hooks';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { ProjectForm } from 'components/common/ProjectForm';
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
      description: '',
      websites: [''],
      farcasterValues: [''],
      twitter: '',
      github: '',
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
      {/* add noValidate so that we onyl rely on react-hook-form validation */}
      <form noValidate onSubmit={handleSubmit(execute)}>
        <ProjectForm control={control} />
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
    </>
  );
}
