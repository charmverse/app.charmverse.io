import styled from '@emotion/styled';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Box, Button, Stack } from '@mui/material';
import TextField from '@mui/material/TextField';
import { Modal, DialogTitle } from 'components/common/Modal';
import log from 'lib/log';

const StyledButton = styled(Button)`
    border-radius: 7px;
`;

export const schema = yup.object({
  description: yup.string().ensure().trim()
});

export type FormValues = yup.InferType<typeof schema>;

type DescriptionModalProps = {
    defaultValues: { description: string },
    save: (description: string) => void,
    close: () => void,
    isOpen: boolean,
};

function DescriptionModal (props: DescriptionModalProps) {
  const { defaultValues, close, isOpen, save } = props;

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<FormValues>({
    defaultValues,
    resolver: yupResolver(schema)
  });

  function onSubmit (values: FormValues) {
    save(values.description);
  }

  return (
    <Modal open={isOpen} onClose={() => {}} size='large'>
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
