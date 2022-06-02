import { useEffect } from 'react';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useForm } from 'react-hook-form';
import { Box, InputAdornment, Stack } from '@mui/material';
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

export default function UserPathModal (props: Props) {
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
    <Modal
      open={isOpen}
      onClose={close}
      size='large'
      sx={{
        '>.modal-container': {
          maxWidth: '100%'
        }
      }}
    >
      <DialogTitle onClose={close}>Personalize your link</DialogTitle>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Stack mt={1}>
          <TextField
            {...register('path')}
            InputProps={{
              startAdornment: <InputAdornment position='start'>{hostname}/</InputAdornment>
            }}
            fullWidth
            error={!!errors.path}
            helperText={errors.path?.message}
            placeholder='awesome-bot'
          />
          <Box mt={4} sx={{ display: 'flex' }}>
            <Button type='submit'>
              Save
            </Button>
          </Box>
        </Stack>
      </form>
    </Modal>
  );
}
