import { yupResolver } from '@hookform/resolvers/yup';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';

import { Button } from 'components/common/Button';
import LoadingComponent from 'components/common/LoadingComponent';
import { DialogTitle, Modal } from 'components/common/Modal';

export const schema = yup.object({
  email: yup.string().email().required()
});

type FormValues = yup.InferType<typeof schema>;

type Props = {
  email?: string;
  onClose?: () => void;
  handleSubmit: (email: string) => void;
  loading?: boolean;
  description?: string;
  title?: string;
};

type DialogProps = Props & {
  isOpen: boolean;
  onClose?: () => void;
};

export function EmailAddressForm({ email = '', handleSubmit: onSubmit, description, title, loading, onClose }: Props) {
  const {
    handleSubmit,
    register,
    formState: { errors, isSubmitted, submitCount }
  } = useForm<FormValues>({
    mode: 'onChange',
    resolver: yupResolver(schema),
    defaultValues: {
      email
    }
  });

  function submitEmail(fields: { email: string }) {
    onSubmit(fields.email);
  }

  return (
    <Box mb={2} px={1} width='100%'>
      <form onSubmit={handleSubmit(submitEmail)}>
        {title && <DialogTitle onClose={onClose}>{title}</DialogTitle>}

        {description && (
          <Typography pl={0.2} mb={2}>
            {description}
          </Typography>
        )}
        <TextField
          {...register('email')}
          placeholder='email@charmverse.io'
          error={isSubmitted && !!errors.email}
          helperText={isSubmitted && !!errors.email && 'Email is invalid'}
          type='text'
          fullWidth
          sx={{ mb: 2 }}
        />
        <Button type='submit' disabled={loading} loading={loading}>
          Submit
        </Button>
      </form>
    </Box>
  );
}

export function EmailAddressFormDialog({
  handleSubmit,
  isOpen,
  onClose,
  title,
  description,
  email,
  loading
}: DialogProps) {
  const { reset } = useForm<FormValues>({
    mode: 'onChange',
    resolver: yupResolver(schema)
  });

  // Close form only used if there is an external close function
  function closeForm() {
    reset();
    onClose?.();
  }

  return (
    <Modal title={title} open={isOpen} onClose={onClose ? closeForm : undefined}>
      {/** Align the title of modal with the dialog */}
      <Box sx={{ mx: -1 }}>
        <EmailAddressForm description={description} handleSubmit={handleSubmit} email={email} loading={loading} />
      </Box>
    </Modal>
  );
}
