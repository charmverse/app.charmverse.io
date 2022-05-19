import styled from '@emotion/styled';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Box, Button, Stack, TextField, Typography } from '@mui/material';
import { Modal, DialogTitle } from 'components/common/Modal';
import log from 'lib/log';

const StyledButton = styled(Button)`
    border-radius: 7px;
    background-color: ${({ theme }) => theme.palette.gray};
`;

export const schema = yup.object({
  description: yup.string().ensure().trim()
    .nullable(true)
});

export type FormValues = yup.InferType<typeof schema>;

type IdentityModalProps = {
    defaultValues: { },
    close: () => void,
    isOpen: boolean,
};

function IdentityModal (props: IdentityModalProps) {
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
      <DialogTitle onClose={close}>Public Identity</DialogTitle>
      <Typography>Select which integration you want to show as your public identity</Typography>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Stack mt={1}>

          <Box justifyContent='end' mt={3} sx={{ display: 'flex' }}>
            <StyledButton
              onClick={() => {
              }}
            >
              Manage Integrations
            </StyledButton>
          </Box>
        </Stack>
      </form>
    </Modal>
  );
}

export default IdentityModal;
