import type { Application } from '@charmverse/core/prisma';
import { yupResolver } from '@hookform/resolvers/yup';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import { Box, Collapse, FormLabel, IconButton, Stack } from '@mui/material';
import Alert from '@mui/material/Alert';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';

import { Button } from 'components/common/Button';
import { useLocalStorage } from 'hooks/useLocalStorage';
import { useUser } from 'hooks/useUser';

import { RewardApplicationStatusChip, applicationStatuses } from '../../RewardApplicationStatusChip';

/**
 * @expandedOnLoad Use this to expand the application initially
 */
interface IApplicationFormProps {
  onSubmit: (applicationMessage: string) => Promise<boolean>;
  onCancel?: VoidFunction;
  rewardId: string;
  application?: Application;
  readOnly?: boolean;
  disableCollapse?: boolean;
  expandedOnLoad?: boolean;
  isSaving?: boolean;
}

export const schema = yup.object({
  message: yup.string().required('Please enter a submission.')
});

type FormValues = yup.InferType<typeof schema>;

export function ApplicationInput({
  readOnly = false,
  onSubmit,
  onCancel,
  rewardId,
  application,
  disableCollapse,
  expandedOnLoad,
  isSaving
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

  const applicationExample = 'Explain why you are the right person or team to work on this';

  const currentApplicationMessage = watch('message');

  return (
    <Stack my={1} gap={1}>
      <Box
        display='flex'
        justifyContent='space-between'
        flexDirection='row'
        gap={0.5}
        onClick={() => !disableCollapse && setIsVisible(!isVisible)}
      >
        <Box display='flex' gap={0.5}>
          <FormLabel sx={{ fontWeight: 'bold' }}>
            {application?.createdBy === user?.id ? 'Your application' : 'Application'}
          </FormLabel>

          {!disableCollapse && (
            <IconButton
              sx={{
                top: -2.5,
                position: 'relative'
              }}
              size='small'
            >
              {isVisible ? <KeyboardArrowUpIcon fontSize='small' /> : <KeyboardArrowDownIcon fontSize='small' />}
            </IconButton>
          )}
        </Box>
        {application && applicationStatuses.includes(application?.status) && (
          <RewardApplicationStatusChip status={application.status} />
        )}
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
                sx={{
                  '.Mui-disabled': {
                    color: 'var(--text-primary) !important',
                    WebkitTextFillColor: 'var(--text-primary) !important'
                  }
                }}
              />
              {errors?.message && <Alert severity='error'>{errors.message.message}</Alert>}
            </Grid>

            {!readOnly && (
              <Grid item display='flex' gap={1} justifyContent='flex-end'>
                {onCancel && (
                  <Button loading={isSaving} onClick={onCancel} color='error' variant='outlined'>
                    Cancel
                  </Button>
                )}
                <Button
                  disabled={
                    !isValid || (!!currentApplicationMessage && currentApplicationMessage === application?.message)
                  }
                  type='submit'
                  loading={isSaving}
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
