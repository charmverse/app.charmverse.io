import { yupResolver } from '@hookform/resolvers/yup';
import Box from '@mui/material/Box';
import DialogTitle from '@mui/material/DialogTitle';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';

import Button from 'components/common/Button';
import LoadingComponent from 'components/common/LoadingComponent';
import { Modal } from 'components/common/Modal';

export const schema = yup.object({
  email: yup.string().email().required()
});

type FormValues = yup.InferType<typeof schema>;

type Props = {
  handleSubmit: (email: string) => void;
  loading?: boolean;
  description?: string;
  title?: string;
};

type DialogProps = Props & {
  isOpen: boolean;
  onClose: () => void;
};

export function CollectEmail({ handleSubmit, description, title, loading }: Props) {
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
    <Box mb={2}>
      {title && <DialogTitle>{title}</DialogTitle>}
      <Box px={3}>
        {description && (
          <Typography pl={0.2} mb={2}>
            {description}
          </Typography>
        )}
        <TextField {...register('email')} placeholder='email@charmverse.io' type='text' fullWidth sx={{ mb: 2 }} />
        <Button disabled={!validEmail() || loading} onClick={submitEmail}>
          Submit
          {loading && (
            <span style={{ marginLeft: '6px' }}>
              <LoadingComponent size={14} />
            </span>
          )}
        </Button>
      </Box>
    </Box>
  );
}

export function CollectEmailDialog({ handleSubmit, isOpen, onClose, title, description, loading }: DialogProps) {
  const { reset } = useForm<FormValues>({
    mode: 'onChange',
    resolver: yupResolver(schema)
  });

  function closeForm() {
    reset();
    onClose();
  }

  return (
    <Modal title={title} open={isOpen} onClose={closeForm}>
      <CollectEmail description={description} handleSubmit={handleSubmit} loading={loading} />
    </Modal>
  );
}
