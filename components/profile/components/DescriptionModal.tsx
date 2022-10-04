import { yupResolver } from '@hookform/resolvers/yup';
import { Box, Stack } from '@mui/material';
import TextField from '@mui/material/TextField';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';

import Button from 'components/common/Button';
import { DialogTitle, Modal } from 'components/common/Modal';

export const schema = yup.object({
  description: yup.string().ensure().trim()
});

export type FormValues = yup.InferType<typeof schema>;

type DescriptionModalProps = {
    currentDescription: string | null | undefined;
    save: (description: string) => void;
    close: () => void;
    isOpen: boolean;
};

function DescriptionModal (props: DescriptionModalProps) {
  const { currentDescription, close, isOpen, save } = props;

  const {
    register,
    reset,
    setValue,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm<FormValues>({
    defaultValues: {
      description: currentDescription || ''
    },
    resolver: yupResolver(schema)
  });

  useEffect(() => {
    reset({
      description: currentDescription || ''
    });
  }, [currentDescription]);

  function onSubmit (values: FormValues) {
    save(values.description);
  }

  const watchDescription = watch('description');

  return (
    <Modal
      open={isOpen}
      onClose={close}
      size='large'
    >
      <DialogTitle onClose={close}>Describe yourself in a few words</DialogTitle>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Stack mt={1}>
          <TextField
            {...register('description')}
            fullWidth
            error={!!errors.description}
            helperText={errors.description?.message}
            placeholder='Tell the world a bit more about yourself ...'
            multiline
            minRows={10}
            onChange={(event) => {
              if (event.target.value.length > 500) {
                setValue('description', event.target.value.substring(0, 500));
              }
              else {
                setValue('description', event.target.value);
              }
            }}
          />
          <Box justifyContent='end' sx={{ display: 'flex' }}>{watchDescription.length}/500</Box>
          <Box sx={{ display: 'flex' }}>
            <Button type='submit'>
              Save
            </Button>
          </Box>
        </Stack>
      </form>
    </Modal>
  );
}

export default DescriptionModal;
