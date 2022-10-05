import { yupResolver } from '@hookform/resolvers/yup';
import { Check, Close } from '@mui/icons-material';
import { Box, InputAdornment, Stack } from '@mui/material';
import TextField from '@mui/material/TextField';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';

import charmClient from 'charmClient';
import Button from 'components/common/Button';
import { DialogTitle, Modal } from 'components/common/Modal';
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
    .test('isAvailable', '${path} is already taken', async (value) => {
      const result = await debouncedValidate(value);
      // debouncedValidate will return undefined if it is being debounced
      if (typeof result === 'boolean') {
        return result;
      }
      return true;
    })
});

export type FormValues = yup.InferType<typeof schema>;

type Props = {
  currentValue: string | null | undefined;
  save: (path: string) => void;
  close: () => void;
  isOpen: boolean;
};

export default function UserPathModal (props: Props) {
  const { currentValue, close, isOpen, save } = props;

  const {
    register,
    reset,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm<FormValues>({
    defaultValues: {
      path: currentValue || ''
    },
    mode: 'onChange',
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

  const hostname = typeof window !== 'undefined' ? `${window.location.origin}/u` : '';
  const pathValue = watch('path');

  let statusIcon = null;
  if (pathValue) {
    if (errors.path) {
      statusIcon = <Close color='error' />;
    }
    else {
      statusIcon = <Check color='success' />;
    }
  }

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
              startAdornment: <InputAdornment position='start'>{hostname}/</InputAdornment>,
              endAdornment: <InputAdornment position='end'>{statusIcon}</InputAdornment>
            }}
            fullWidth
            error={!!errors.path}
            helperText={errors.path?.message || ' '}
            placeholder='awesome-bot'
          />
          <Box mt={2} sx={{ display: 'flex' }}>
            <Button disabled={!!errors.path} type='submit'>
              Save
            </Button>
          </Box>
        </Stack>
      </form>
    </Modal>
  );
}
