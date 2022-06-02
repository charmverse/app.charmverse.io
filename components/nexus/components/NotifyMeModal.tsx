import { useEffect } from 'react';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useForm } from 'react-hook-form';
import { Box, FormHelperText, Stack } from '@mui/material';
import Button from 'components/common/Button';
import TextField from '@mui/material/TextField';
import { Modal, DialogTitle } from 'components/common/Modal';

export const schema = yup.object({
  path: yup.string().ensure().trim()
    .min(3)
    .max(50)
});

export type FormValues = yup.InferType<typeof schema>;

type Props = {
  currentValue: string | null | undefined,
  save: (path: string) => void,
  close: () => void,
  isOpen: boolean,
};

export default function NotifyMeModal (props: Props) {
  const { currentValue, close, isOpen, save } = props;

  const {
    register,
    reset,
    handleSubmit,
    formState: { errors }
  } = useForm<FormValues>({
    defaultValues: {
      path: currentValue || ''
    },
    resolver: yupResolver(schema)
  });

  useEffect(() => {
    reset({
      path: currentValue || ''
    });
  }, [currentValue]);

  function onSubmit (values: FormValues) {
    save(values.path);
  }

  const hostname = typeof window !== 'undefined' ? window.location.origin : '';

  return (
    <Modal open={isOpen} onClose={close} title='Receive daily notifications'>
      <form onSubmit={handleSubmit(onSubmit)}>
        <FormHelperText sx={{ mb: 1 }}>
          Input your email to receive daily notifications.
          <br />Note: Your email is private and not used for anything else
        </FormHelperText>

        <TextField
          {...register('path')}
          fullWidth
          error={!!errors.path}
          helperText={errors.path?.message}
          placeholder='me@gmail.com'
          sx={{ mb: 2 }}
        />
        <Button type='submit'>
          Save
        </Button>
      </form>
    </Modal>
  );
}
