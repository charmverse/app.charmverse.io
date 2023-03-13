import { yupResolver } from '@hookform/resolvers/yup';
import { TextField } from '@mui/material';
import InputLabel from '@mui/material/InputLabel';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';

import Button from 'components/common/Button';
import { Modal } from 'components/common/Modal';

export const schema = yup.object({
  email: yup.string().email().required()
});

type FormValues = yup.InferType<typeof schema>;

type Props = {
  handleSubmit: (email: string) => void;
  isOpen: boolean;
  onClose: () => void;
};

export function CollectEmailDialog({ handleSubmit, isOpen, onClose }: Props) {
  const { register, getValues, getFieldState, formState, reset, trigger, watch } = useForm<FormValues>({
    mode: 'onChange',
    resolver: yupResolver(schema)
  });
  // Return actual email or null
  function validEmail(): string | false {
    const values = getValues();
    const hasError = getFieldState('email').invalid;
    if (!!values.email && !hasError) {
      return values.email;
    }
    return false;
  }

  function closeForm() {
    reset();
    onClose();
  }

  function submitEmail() {
    const validValue = validEmail();
    if (validValue) {
      handleSubmit(validValue);
    }
  }

  const values = watch();

  return (
    <Modal open={isOpen} onClose={closeForm}>
      <InputLabel>Email</InputLabel>
      <TextField {...register('email')} type='text' fullWidth sx={{ mb: 2 }} />
      <Button disabled={!validEmail()} onClick={submitEmail}>
        Submit
      </Button>
    </Modal>
  );
}
