import { yupResolver } from '@hookform/resolvers/yup';
import { Box, Collapse, FormLabel, IconButton, Stack, Typography } from '@mui/material';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import { Application } from '@prisma/client';
import charmClient from 'charmClient';
import { useBounties } from 'hooks/useBounties';
import { useLocalStorage } from 'hooks/useLocalStorage';
import { useUser } from 'hooks/useUser';
import { MINIMUM_APPLICATION_MESSAGE_CHARACTERS } from 'lib/applications/shared';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import { FormMode } from '../../BountyEditorForm';

/**
 * @expandedOnLoad Use this to expand the application initially
 */
interface IApplicationFormProps {
  onSubmit?: (application: Application) => any,
  bountyId: string
  mode?: FormMode
  proposal?: Application
  onCancel?: () => void
  readOnly?: boolean
  expandedOnLoad?: boolean
}

export const schema = yup.object({
  message: yup.string().required('Please enter a proposal.').min(MINIMUM_APPLICATION_MESSAGE_CHARACTERS, `Application proposal must contain at least ${MINIMUM_APPLICATION_MESSAGE_CHARACTERS} characters.`)
});

type FormValues = yup.InferType<typeof schema>

export function ApplicationEditorForm ({ readOnly = false, onCancel, onSubmit, bountyId, proposal, mode = 'create', expandedOnLoad }: IApplicationFormProps) {
  const { refreshBounty } = useBounties();
  const [isVisible, setIsVisible] = useState(mode === 'create' || expandedOnLoad);
  const [user] = useUser();

  const [applicationMessage, setApplicationMessage] = useLocalStorage(`${bountyId}.${user?.id}.application`, '');

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    setValue
  } = useForm<FormValues>({
    mode: 'onChange',
    defaultValues: {
      // Default to saved message in local storage
      message: proposal?.message as string ?? applicationMessage
    },
    resolver: yupResolver(schema)
  });

  const applicationExample = 'Explain why you are the right person or team to work on this bounty.';

  async function submitted (proposalToSave: Application) {
    if (mode === 'create') {
      proposalToSave.bountyId = bountyId;
      proposalToSave.status = 'applied';
      const createdApplication = await charmClient.createApplication(proposalToSave);
      if (onSubmit) {
        onSubmit(createdApplication);
      }
      refreshBounty(bountyId);
      setApplicationMessage('');
    }
    else if (mode === 'update') {
      await charmClient.updateApplication(proposal?.id as string, proposalToSave);
      if (onSubmit) {
        onSubmit(proposalToSave);
      }
      refreshBounty(bountyId);
    }

  }

  return (
    <Stack my={1} gap={1}>
      <Stack
        flexDirection='row'
        gap={0.5}
        onClick={() => {
          setIsVisible(!isVisible);
        }}
      >
        <FormLabel
          sx={{
            fontWeight: 'bold'
          }}
        >
          {proposal?.createdBy === user?.id ? 'Your application' : 'Application'}
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
      </Stack>
      <Collapse in={isVisible} timeout='auto' unmountOnExit>
        <form onSubmit={handleSubmit(formValue => submitted(formValue as Application))} style={{ margin: 'auto', width: '100%' }}>
          <Grid container direction='column' spacing={3}>
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
                  // Only store in local storage if no proposal exists yet
                  const newText = ev.target.value;
                  if (!proposal) {
                    setApplicationMessage(newText);
                  }

                  setValue('message', newText, {
                    shouldValidate: true
                  });
                }}
              />
              {
                errors?.message && (
                <Alert severity='error'>
                  {errors.message.message}
                </Alert>
                )
              }

            </Grid>

            {!readOnly && (
            <Grid item display='flex' gap={1}>
              <Button
                disabled={!isValid}
                type='submit'
              >{mode === 'create' ? ' Submit' : 'Update'}
              </Button>
              <Button
                onClick={() => {
                  onCancel?.();
                  setIsVisible(false);
                }}
                variant='outlined'
                color='secondary'
              >Cancel
              </Button>
            </Grid>
            )}
          </Grid>

        </form>
      </Collapse>
    </Stack>
  );
}

