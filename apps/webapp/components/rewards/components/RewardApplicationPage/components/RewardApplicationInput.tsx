import type { Application } from '@charmverse/core/prisma';
import { yupResolver } from '@hookform/resolvers/yup';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import { Box, Collapse, FormLabel, IconButton, Stack } from '@mui/material';
import Alert from '@mui/material/Alert';
import Grid from '@mui/material/Grid';
import type { PageContent } from '@packages/charmeditor/interfaces';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';

import { Button } from 'components/common/Button';
import { CharmEditor } from 'components/common/CharmEditor';
import { useUser } from 'hooks/useUser';

import { RewardApplicationStatusChip, applicationStatuses } from '../../RewardApplicationStatusChip';

/**
 * @expandedOnLoad Use this to expand the application initially
 */
interface IApplicationFormProps {
  onSubmit: (data: { message: string; messageNodes: string }) => Promise<boolean>;
  onCancel?: VoidFunction;
  application?: Application;
  readOnly?: boolean;
  disableCollapse?: boolean;
  expandedOnLoad?: boolean;
  isSaving?: boolean;
}

export const schema = yup.object({
  message: yup.string().required('Please enter a submission.'),
  messageNodes: yup.mixed<string>().required()
});

type FormValues = yup.InferType<typeof schema>;

export function ApplicationInput({
  readOnly = false,
  onSubmit,
  onCancel,
  application,
  disableCollapse,
  expandedOnLoad,
  isSaving
}: IApplicationFormProps) {
  const [isVisible, setIsVisible] = useState(expandedOnLoad);
  const { user } = useUser();

  const {
    handleSubmit,
    formState: { errors, isValid },
    setValue,
    watch
  } = useForm<FormValues>({
    mode: 'onChange',
    defaultValues: {
      message: application?.message as string,
      messageNodes: application?.messageNodes as any as string
    },
    resolver: yupResolver(schema)
  });

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
          onSubmit={handleSubmit((formValue) =>
            onSubmit({
              message: formValue.message,
              messageNodes: formValue.messageNodes
            })
          )}
          style={{ margin: 'auto', width: '100%' }}
        >
          <Grid container direction='column' spacing={1}>
            <Grid item data-test='application-input'>
              <CharmEditor
                content={application?.messageNodes as PageContent}
                onContentChange={(content) => {
                  setValue('message', content.rawText, {
                    shouldValidate: true
                  });
                  setValue('messageNodes', content.doc as any, {
                    shouldValidate: true
                  });
                }}
                style={{
                  backgroundColor: 'var(--input-bg)',
                  border: '1px solid var(--input-border)',
                  borderRadius: 3,
                  minHeight: 130,
                  left: 0
                }}
                readOnly={readOnly}
                placeholderText='Explain why you are the right person or team to work on this'
                key={`${readOnly}.${application?.status}`}
                disableRowHandles
                isContentControlled
                disableNestedPages
              />
              {errors?.message && <Alert severity='error'>{errors.message.message}</Alert>}
            </Grid>

            {!readOnly && (
              <Grid item display='flex' gap={1} justifyContent='flex-end'>
                {onCancel && (
                  <Button disabled={isSaving} onClick={onCancel} color='error' variant='outlined'>
                    Cancel
                  </Button>
                )}
                <Button
                  disabled={
                    !isValid || (!!currentApplicationMessage && currentApplicationMessage === application?.message)
                  }
                  type='submit'
                  data-test='submit-application-button'
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
