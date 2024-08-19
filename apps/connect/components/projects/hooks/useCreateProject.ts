import { log } from '@charmverse/core/log';
import { schema, type FormValues } from '@connect-shared/lib/projects/projectSchema';
import { yupResolver } from '@hookform/resolvers/yup';
import { useRouter } from 'next/navigation';
import { useAction } from 'next-safe-action/hooks';
import { useForm } from 'react-hook-form';

import { actionCreateProject } from 'lib/projects/createProjectAction';

export function useCreateProject({ fid }: { fid?: number }) {
  const {
    setError,
    formState,
    handleSubmit: _handleSubmit,
    ...restProps
  } = useForm<FormValues>({
    defaultValues: {
      name: '',
      description: '',
      optimismCategory: '' as any,
      websites: [''],
      farcasterValues: [''],
      twitter: '',
      github: '',
      projectMembers: [{ farcasterId: fid }]
    },
    resolver: yupResolver(schema),
    mode: 'onSubmit'
  });

  const router = useRouter();

  const { execute, isExecuting } = useAction(actionCreateProject, {
    onSuccess: (data) => {
      router.push(`/p/${data.data?.projectPath as string}/publish`);
    },
    onError(err) {
      const fetchError = err.error?.fetchError;
      const validationErrors = err.error.validationErrors;
      const serverError = err.error.serverError;
      const formErrors = validationErrors?.formErrors || [];
      const fieldErrors = validationErrors?.fieldErrors || [];
      const fieldErrorValues = Object.entries(fieldErrors).map(([key, value]) => ({
        name: key,
        type: 'manual',
        message: (value || '').join('\n')
      }));

      for (const { name, type, message } of fieldErrorValues) {
        setError(name as any, { type, message });
      }

      for (const formError of formErrors) {
        setError('root.serverError', { type: 'manual', message: formError });
      }

      if (serverError?.message) {
        setError('root.serverError', { type: serverError?.code?.toString(), message: serverError.message });
      }

      if (fetchError) {
        setError('root.serverError', { type: 'fetchError', message: fetchError });
      }

      log.error(err.error.serverError?.message || 'Something went wrong', err.error);
    }
  });

  const handleSubmit = _handleSubmit(execute);

  return { handleSubmit, formState, ...restProps, isExecuting };
}
