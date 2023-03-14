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
};

type DialogProps = Props & {
  isOpen: boolean;
  onClose: () => void;
};

export function CollectEmail({ handleSubmit }: Props) {
  const { register, getValues, getFieldState, watch } = useForm<FormValues>({
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

  function submitEmail() {
    const validValue = validEmail();
    if (validValue) {
      handleSubmit(validValue);
    }
  }

  const values = watch();

  return (
    <div>
      <InputLabel>Email</InputLabel>
      <TextField {...register('email')} placeholder='me@gmail.com' type='text' fullWidth sx={{ mb: 2 }} />
      <Button disabled={!validEmail()} onClick={submitEmail}>
        Submit
      </Button>
    </div>
  );
}

export function CollectEmailDialog({ handleSubmit, isOpen, onClose }: DialogProps) {
  const { reset } = useForm<FormValues>({
    mode: 'onChange',
    resolver: yupResolver(schema)
  });

  function closeForm() {
    reset();
    onClose();
  }

  return (
    <Modal open={isOpen} onClose={closeForm}>
      <CollectEmail handleSubmit={handleSubmit} />
    </Modal>
  );
}
