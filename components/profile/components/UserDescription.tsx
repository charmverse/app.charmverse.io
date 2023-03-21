import { yupResolver } from '@hookform/resolvers/yup';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import type { ChangeEvent } from 'react';
import { useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';

import FieldLabel from 'components/common/form/FieldLabel';
import debounce from 'lib/utilities/debounce';

export const schema = yup.object({
  description: yup.string().ensure().trim()
});

export type FormValues = yup.InferType<typeof schema>;

type UserDescriptionProps = {
  currentDescription: string | null | undefined;
  save: (description: string) => Promise<void>;
  readOnly?: boolean;
};

function UserDescription(props: UserDescriptionProps) {
  const { currentDescription = '', save, readOnly } = props;

  const {
    register,
    trigger,
    setValue,
    watch,
    formState: { errors }
  } = useForm<FormValues>({
    defaultValues: {
      description: currentDescription || ''
    },
    mode: 'onChange',
    resolver: yupResolver(schema)
  });

  useEffect(() => {
    if (currentDescription && currentDescription !== watch('description')) {
      setValue('description', currentDescription || '');
    }
  }, [currentDescription]);

  const onSave = useCallback(
    debounce(async (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      if (!readOnly) {
        const val = event.target.value;
        const validate = await trigger();

        if (validate && val.length <= 500) {
          await save(val);
        }
      }
    }, 300),
    [readOnly]
  );

  const watchDescription = watch('description');

  return (
    <Box mt={1}>
      <FieldLabel>About me</FieldLabel>
      <TextField
        {...register('description')}
        disabled={readOnly}
        data-testid='edit-description'
        fullWidth
        error={!!errors.description}
        helperText={errors.description?.message}
        placeholder='Tell the world a bit more about yourself ...'
        multiline
        minRows={2}
        onChange={async (event) => {
          const val = event.target.value;
          setValue('description', val.length > 500 ? val.substring(0, 500) : val);
          await onSave(event);
        }}
      />
      <Box justifyContent='end' display='flex'>
        {watchDescription.length}/500
      </Box>
    </Box>
  );
}

export default UserDescription;
