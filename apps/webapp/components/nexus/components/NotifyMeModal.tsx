import { yupResolver } from '@hookform/resolvers/yup';
import { Box, FormHelperText } from '@mui/material';
import TextField from '@mui/material/TextField';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';

import { Button } from 'components/common/Button';
import { Modal } from 'components/common/Modal';

export const schema = yup.object({
  email: yup.string().ensure().trim().email().max(50)
});

export type FormValues = yup.InferType<typeof schema>;

type Props = {
  currentValue: string | null | undefined;
  save: (path: string) => void;
  close: () => void;
  isOpen: boolean;
};

export default function NotifyMeModal(props: Props) {
  const { currentValue, close, isOpen, save } = props;

  const {
    register,
    reset,
    handleSubmit,
    formState: { errors }
  } = useForm<FormValues>({
    defaultValues: {
      email: currentValue || ''
    },
    resolver: yupResolver(schema)
  });

  useEffect(() => {
    reset({
      email: currentValue || ''
    });
  }, [currentValue]);

  function onSubmit(values: FormValues) {
    save(values.email);
  }

  function removeNotifications() {
    save('');
  }

  return (
    <Modal open={isOpen} onClose={close} title='Receive notifications'>
      <form onSubmit={handleSubmit(onSubmit)}>
        <FormHelperText sx={{ mb: 1 }}>
          Input your email to receive CharmVerse notifications.
          <br />
          Note: Your email is private and not used for anything else
        </FormHelperText>

        <TextField
          {...register('email')}
          autoFocus
          fullWidth
          error={!!errors.email}
          helperText={errors.email?.message}
          placeholder='me@gmail.com'
          sx={{ mb: 2 }}
        />
        <Box display='flex' gap={1}>
          <Button type='submit'>Save</Button>
          {currentValue && (
            <Button onClick={removeNotifications} color='secondary' variant='outlined'>
              Remove
            </Button>
          )}
        </Box>
      </form>
    </Modal>
  );
}
