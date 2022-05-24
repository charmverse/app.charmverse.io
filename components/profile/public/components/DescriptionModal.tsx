import { useEffect } from 'react';
import styled from '@emotion/styled';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useForm } from 'react-hook-form';
import { Box, Button, Stack } from '@mui/material';
import TextField from '@mui/material/TextField';
import { Modal, DialogTitle } from 'components/common/Modal';

const StyledButton = styled(Button)`
    border-radius: 7px;
`;

export const schema = yup.object({
  description: yup.string().ensure().trim()
});

export type FormValues = yup.InferType<typeof schema>;

type DescriptionModalProps = {
    currentDescription: string | null | undefined,
    save: (description: string) => void,
    close: () => void,
    isOpen: boolean,
};

function DescriptionModal (props: DescriptionModalProps) {
  const { currentDescription, close, isOpen, save } = props;

  const {
    register,
    reset,
    handleSubmit,
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

  return (
    <Modal open={isOpen} onClose={close} size='large'>
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
          />
          <Box justifyContent='end' mt={3} sx={{ display: 'flex' }}>
            <StyledButton type='submit'>
              Save
            </StyledButton>
          </Box>
        </Stack>
      </form>
    </Modal>
  );
}

export default DescriptionModal;
