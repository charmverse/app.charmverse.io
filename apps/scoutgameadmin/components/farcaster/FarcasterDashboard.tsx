'use client';

import { Add as AddIcon, Clear as ClearIcon } from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import { CircularProgress, Container, Paper, Stack, TextField, Box, Typography } from '@mui/material';
import { useAction } from 'next-safe-action/hooks';
import React, { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';

import { useSearchUsers } from 'hooks/api/users';
import { useDebouncedValue } from 'hooks/useDebouncedValue';
import type { SuccessResponse, APIErrorResponse, InvalidInputResponse } from 'lib/farcaster/sendMessagesAction';
import { sendMessagesAction } from 'lib/farcaster/sendMessagesAction';
import type { SortField, SortOrder } from 'lib/users/getUsers';

type FarcasterFormInputs = {
  messageContent: string;
  recipients: string;
};

export function FarcasterDashboard() {
  const {
    register,
    reset,
    handleSubmit,
    formState: { errors }
  } = useForm<FarcasterFormInputs>();

  const { executeAsync: sendMessages, hasErrored, isExecuting: isSending, result } = useAction(sendMessagesAction);

  const onSubmit = async (data: FarcasterFormInputs) => {
    // Handle form submission
    const recipients = data.recipients
      .split(/[\s,]+/)
      .map((recipient) => recipient.trim())
      .filter(Boolean);
    await sendMessages({ message: data.messageContent, recipients });
  };
  return (
    <Container maxWidth='xl'>
      <Stack spacing={3} sx={{ width: { xs: '100%', lg: '50%' } }}>
        <Typography variant='h5'>Farcaster Bulk Message Sender</Typography>

        <Paper sx={{ p: 3 }}>
          <Typography variant='subtitle1' gutterBottom>
            Send a message from Chris's Farcaster account
          </Typography>
          <br />
          <form onSubmit={handleSubmit(onSubmit)}>
            <Stack spacing={2}>
              <TextField
                label='Message Content'
                multiline
                autoFocus
                rows={4}
                fullWidth
                placeholder='Enter the message you want to send...'
                {...register('messageContent', { required: 'Message content is required' })}
                error={!!errors.messageContent}
                helperText={errors.messageContent?.message}
              />

              <Box>
                <TextField
                  label='Recipients'
                  multiline
                  rows={4}
                  fullWidth
                  placeholder='Enter Farcaster usernames (comma or space separated)'
                  helperText={errors.recipients?.message || 'Paste multiple addresses, comma or space separated'}
                  {...register('recipients', { required: 'Recipients are required' })}
                  error={!!errors.recipients}
                />
              </Box>

              <Box display='flex' justifyContent='space-between' alignItems='center' gap={2}>
                <Box>
                  {isAPIErrorResponse(result.data) && (
                    <Typography variant='subtitle1' color='error'>
                      Error sending messages: {result.data.error}
                    </Typography>
                  )}
                  {isInvalidInputResponse(result.data) && (
                    <Typography variant='subtitle1' color='error'>
                      Message not sent. Some recipients were invalid: {result.data.invalidRecipients.join(', ')}
                    </Typography>
                  )}
                  {hasErrored && (
                    <Typography variant='subtitle1' color='error'>
                      Something went wrong
                    </Typography>
                  )}
                  {isSuccessResponse(result.data) && (
                    <Typography variant='subtitle1' color='success'>
                      {result.data.sent} message(s) sent successfully
                    </Typography>
                  )}
                </Box>
                <Box display='flex' justifyContent='flex-end' gap={2}>
                  <LoadingButton variant='outlined' onClick={() => reset()}>
                    Clear
                  </LoadingButton>
                  <LoadingButton
                    loading={isSending}
                    type='submit'
                    color='primary'
                    sx={{
                      bgcolor: 'primary.main',
                      color: 'white',
                      '&:hover': {
                        bgcolor: 'primary.dark'
                      }
                    }}
                  >
                    Send Messages
                  </LoadingButton>
                </Box>
              </Box>
            </Stack>
          </form>

          {isAPIErrorResponse(result.data) && (
            <Box pt={2}>
              <Typography variant='subtitle1' sx={{ mb: 2 }}>
                {result.data.sentRecipients.length} messages were successfully sent. The following recipients failed:
              </Typography>
              <TextField label='Failed recipients' value={result.data?.unsentRecipients} multiline rows={4} fullWidth />
            </Box>
          )}
        </Paper>
      </Stack>
    </Container>
  );
}

export function isSuccessResponse(response: any): response is SuccessResponse {
  return response?.type === 'success';
}

export function isInvalidInputResponse(response: any): response is InvalidInputResponse {
  return response?.type === 'invalid_input';
}

export function isAPIErrorResponse(response: any): response is APIErrorResponse {
  return response?.type === 'warpcast_error';
}
