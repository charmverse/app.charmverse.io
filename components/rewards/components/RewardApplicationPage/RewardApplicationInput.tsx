import type { Application } from '@charmverse/core/prisma';
import { yupResolver } from '@hookform/resolvers/yup';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import { Box, Collapse, FormLabel, IconButton, Stack } from '@mui/material';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';

import { useLocalStorage } from 'hooks/useLocalStorage';
import { useUser } from 'hooks/useUser';

import { RewardApplicationStatusChip } from '../RewardApplicationStatusChip';

/**
 * @expandedOnLoad Use this to expand the application initially
 */
interface IApplicationFormProps {
  onSubmit: (applicationMessage: string) => any;
  rewardId: string;
  application?: Application;
  readOnly?: boolean;
  expandedOnLoad?: boolean;
}

export const schema = yup.object({
  message: yup.string().required('Please enter a submission.')
});

type FormValues = yup.InferType<typeof schema>;

export default function ApplicationInput({
  readOnly = false,
  onSubmit,
  rewardId,
  application,
  expandedOnLoad
}: IApplicationFormProps) {
  const [isVisible, setIsVisible] = useState(expandedOnLoad);
  const { user } = useUser();

  const [applicationMessage, setApplicationMessage] = useLocalStorage(`${rewardId}.${user?.id}.application`, '');
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    setValue,
    watch
  } = useForm<FormValues>({
    mode: 'onChange',
    defaultValues: {
      // Default to saved message in local storage
      message: (application?.message as string) ?? applicationMessage
    },
    resolver: yupResolver(schema)
  });

  const applicationExample = 'Explain why you are the right person or team to work on this bounty.';

  const currentApplicationMessage = watch('message');

  return (
    <Stack my={1} gap={1}>
      <Box
        display='flex'
        justifyContent='space-between'
        flexDirection='row'
        gap={0.5}
        onClick={() => setIsVisible(!isVisible)}
      >
        <Box display='flex' gap={0.5}>
          <FormLabel sx={{ fontWeight: 'bold' }}>
            {application?.createdBy === user?.id ? 'Your application' : 'Application'}
          </FormLabel>

          <IconButton
            sx={{
              top: -2.5,
              position: 'relative'
            }}
            size='small'
          >
            {isVisible ? <KeyboardArrowUpIcon fontSize='small' /> : <KeyboardArrowDownIcon fontSize='small' />}
          </IconButton>
        </Box>
        {application && <RewardApplicationStatusChip status={application.status} />}
      </Box>
      <Collapse in={isVisible} timeout='auto' unmountOnExit>
        <form
          onSubmit={handleSubmit((formValue) => onSubmit(formValue.message))}
          style={{ margin: 'auto', width: '100%' }}
        >
          <Grid container direction='column' spacing={1}>
            <Grid item>
              <TextField
                {...register('message')}
                autoFocus
                placeholder={applicationExample}
                minRows={5}
                multiline
                variant='outlined'
                type='text'
                fullWidth
                disabled={readOnly}
                onChange={(ev) => {
                  // Only store in local storage if no application exists yet
                  const newText = ev.target.value;
                  if (!application) {
                    setApplicationMessage(newText);
                  }

                  setValue('message', newText, {
                    shouldValidate: true
                  });
                }}
              />
              {errors?.message && <Alert severity='error'>{errors.message.message}</Alert>}
            </Grid>

            {!readOnly && (
              <Grid item display='flex' gap={1} justifyContent='flex-end'>
                <Button
                  disabled={
                    !isValid || (!!currentApplicationMessage && currentApplicationMessage === application?.message)
                  }
                  type='submit'
                >
                  {!application ? ' Apply' : 'Update'}
                </Button>
              </Grid>
            )}
          </Grid>
        </form>
      </Collapse>
    </Stack>
  );
}
