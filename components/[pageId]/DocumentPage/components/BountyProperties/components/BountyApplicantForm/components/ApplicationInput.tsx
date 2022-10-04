import { yupResolver } from '@hookform/resolvers/yup';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import { Box, Collapse, FormLabel, IconButton, Stack } from '@mui/material';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import type { Application } from '@prisma/client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';

import charmClient from 'charmClient';
import { useBounties } from 'hooks/useBounties';
import { useLocalStorage } from 'hooks/useLocalStorage';
import { useUser } from 'hooks/useUser';
import { MINIMUM_APPLICATION_MESSAGE_CHARACTERS } from 'lib/applications/shared';

import BountyApplicantStatus from '../../BountyApplicantStatus';

/**
 * @expandedOnLoad Use this to expand the application initially
 */
interface IApplicationFormProps {
  onSubmit?: (application: Application) => any;
  bountyId: string;
  mode?: 'create' | 'update' | 'suggest';
  proposal?: Application;
  onCancel?: () => void;
  readOnly?: boolean;
  expandedOnLoad?: boolean;
  alwaysExpanded?: boolean;
}

export const schema = yup.object({
  message: yup.string().required('Please enter a proposal.').min(MINIMUM_APPLICATION_MESSAGE_CHARACTERS, `Application proposal must contain at least ${MINIMUM_APPLICATION_MESSAGE_CHARACTERS} characters.`)
});

type FormValues = yup.InferType<typeof schema>;

export default function ApplicationInput ({ readOnly = false, onCancel, onSubmit, bountyId, proposal, mode = 'create', alwaysExpanded, expandedOnLoad }: IApplicationFormProps) {
  const { refreshBounty } = useBounties();
  const [isVisible, setIsVisible] = useState(mode === 'create' || expandedOnLoad || alwaysExpanded);
  const { user } = useUser();

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
      const createdApplication = await charmClient.bounties.createApplication(proposalToSave);
      if (onSubmit) {
        onSubmit(createdApplication);
      }
      refreshBounty(bountyId);
      setApplicationMessage('');
    }
    else if (mode === 'update') {
      await charmClient.bounties.updateApplication(proposal?.id as string, proposalToSave);
      if (onSubmit) {
        onSubmit(proposalToSave);
      }
      refreshBounty(bountyId);
    }

  }

  return (
    <Stack my={1} gap={1}>
      <Box
        display='flex'
        justifyContent='space-between'
        flexDirection='row'
        gap={0.5}
        sx={{ cursor: !alwaysExpanded ? 'pointer' : 'inherit' }}
        onClick={() => {
          if (!alwaysExpanded) {
            setIsVisible(!isVisible);
          }
        }}
      >
        <Box display='flex' gap={0.5}>
          <FormLabel sx={{ fontWeight: 'bold' }}>
            {proposal?.createdBy === user?.id ? 'Your application' : 'Application'}
          </FormLabel>

          {!alwaysExpanded && (
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
        {proposal && proposal.status === 'applied' && proposal.createdBy === user?.id && (
          <BountyApplicantStatus submission={proposal} />
        )}

      </Box>
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

