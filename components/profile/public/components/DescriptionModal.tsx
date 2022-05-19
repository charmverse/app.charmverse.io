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
    .nullable(true)
});

export type FormValues = yup.InferType<typeof schema>;

type DescriptionModalProps = {
    defaultValues: { description: string },
    close: () => void,
    isOpen: boolean,
};

function DescriptionModal (props: DescriptionModalProps) {
  const { defaultValues, close, isOpen } = props;

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<FormValues>({
    defaultValues,
    resolver: yupResolver(schema)
  });

  function onSubmit (values: FormValues) {
    try {
    }
    catch (err) {
      log.error('Error updating description', err);
    }
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
            <StyledButton
              onClick={() => {
              }}
            >
              Save
            </StyledButton>
          </Box>
        </Stack>
      </form>
    </Modal>
  );
}

export default DescriptionModal;
