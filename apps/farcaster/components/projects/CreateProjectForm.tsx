'use client';

import { log } from '@charmverse/core/log';
import { FormErrors } from '@connect-shared/components/project/FormErrors';
import { ProjectForm } from '@connect-shared/components/project/ProjectForm';
import type { FormValues as SharedFormValues } from '@connect-shared/lib/projects/projectSchema';
import { yupResolver } from '@hookform/resolvers/yup';
import { Button, Stack } from '@mui/material';
import { concatenateStringValues } from '@root/lib/utils/strings';
import { useAction } from 'next-safe-action/hooks';
import { useState } from 'react';
import type { Control } from 'react-hook-form';
import { useForm } from 'react-hook-form';

import { createProjectAction } from 'lib/projects/createProjectAction';
import type { FormValues } from 'lib/projects/projectSchema';
import { schema } from 'lib/projects/projectSchema';

export function CreateProjectForm({
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
        control={control as Control<SharedFormValues>}
        isCategoryRequired={false}
        isWebsitesRequired={false}
        isDescriptionRequired={false}
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
        {!isExecuting && errors?.length && <FormErrors errors={errors} />}
        <Button
          data-test='project-form-confirm-values'
          size='large'
          disabled={isExecuting}
          onClick={handleSubmit(execute)}
        >
          Create
        </Button>
      </Stack>
    </>
  );
}
