import { useEffect } from 'react';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useForm } from 'react-hook-form';
import { Box, InputAdornment, Stack } from '@mui/material';
import Button from 'components/common/Button';
import TextField from '@mui/material/TextField';
import { Modal, DialogTitle } from 'components/common/Modal';
import charmClient from 'charmClient';
import debouncePromise from 'lib/utilities/debouncePromise';

async function validatePath (path: string) {
  const result = await charmClient.checkNexusPath(path);
  return result.available;
}

const debouncedValidate = debouncePromise(validatePath, 500);

export const schema = yup.object({
  path: yup.string().ensure().trim().lowercase()
    .min(3)
    .max(50)
    .matches(/^[a-zA-Z0-9-]+$/g, 'Only alphanumeric characters and hyphens are allowed')
    // eslint-disable-next-line no-template-curly-in-string
    .test('isAvailable', '${path} is already taken', debouncedValidate)
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
            <Button disabled={!!errors.path} type='submit'>
              Save
            </Button>
          </Box>
        </Stack>
      </form>
    </Modal>
  );
}
