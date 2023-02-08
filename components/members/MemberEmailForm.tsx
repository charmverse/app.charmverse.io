import { useTheme } from '@emotion/react';
import { yupResolver } from '@hookform/resolvers/yup';
import { Dialog, DialogActions, DialogContent, TextField, Typography, useMediaQuery } from '@mui/material';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';

import charmClient from 'charmClient';
import Button from 'components/common/Button';
import LoadingComponent from 'components/common/LoadingComponent';
import { DialogTitle } from 'components/common/Modal';
import { useUser } from 'hooks/useUser';

export const schema = yup.object({
  email: yup.string().ensure().trim().email().max(50)
});

export type FormValues = yup.InferType<typeof schema>;

export function MemberEmailForm({ onNext }: { onNext: VoidFunction }) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'));
  const { user, setUser, isLoaded } = useUser();

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<FormValues>({
    defaultValues: {
      email: ''
    },
    resolver: yupResolver(schema)
  });

  if (user?.email) {
    return null;
  }

  async function saveEmail(formValues: FormValues) {
    await charmClient.updateUser({
      email: formValues.email
    });
    setUser({ ...user, email: formValues.email });
    onNext();
  }

  return (
    <Dialog data-test='member-email-modal' open fullWidth fullScreen={fullScreen}>
      {!isLoaded && !user ? (
        <DialogContent>
          <LoadingComponent isLoading />
        </DialogContent>
      ) : (
        <>
          <DialogTitle sx={{ '&&': { px: 2, py: 2 } }}>Welcome to CharmVerse</DialogTitle>
          <DialogContent>
            <Typography
              sx={{
                mb: 2
              }}
            >
              CharmVerse can use your email address to let you know when there is a conversation or activity you should
              be part of.
            </Typography>
            <form onSubmit={handleSubmit(saveEmail)}>
              <TextField
                {...register('email')}
                autoFocus
                fullWidth
                error={!!errors.email}
                helperText={errors.email?.message}
                placeholder='me@gmail.com'
                sx={{ mb: 2 }}
                data-test='member-email-input'
              />
              <DialogActions
                sx={{
                  justifyContent: 'flex-end',
                  display: 'flex'
                }}
              >
                <Button variant='outlined' color='secondary' onClick={onNext}>
                  Skip
                </Button>
                <Button data-test='member-email-next' type='submit' color='primary'>
                  Next
                </Button>
              </DialogActions>
            </form>
          </DialogContent>
        </>
      )}
    </Dialog>
  );
}
