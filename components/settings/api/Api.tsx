import { yupResolver } from '@hookform/resolvers/yup';
import LaunchIcon from '@mui/icons-material/LaunchOutlined';
import { Alert, Button, FormControlLabel, FormGroup, Grid, InputLabel, Switch, TextField } from '@mui/material';
import Typography from '@mui/material/Typography';
import type { Space } from '@prisma/client';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';

import Link from 'components/common/Link';
import { useIsAdmin } from 'hooks/useIsAdmin';
import { useSnackbar } from 'hooks/useSnackbar';
import useWebhookSubscription from 'hooks/useSpaceWebhook';
import log from 'lib/log';

import Legend from '../Legend';

export const schema = yup.object({
  webhookUrl: yup.string().nullable(true),
  events: yup
    .object({
      discussion: yup.boolean().defined(),
      comment: yup.boolean().defined(),
      proposal: yup.boolean().defined(),
      bounty: yup.boolean().defined()
    })
    .defined()
});

type FormValues = yup.InferType<typeof schema>;

export function ApiSettings({ space }: { space: Space }) {
  const isAdmin = useIsAdmin();
  const { updateSpaceWebhook, spaceWebhook, isLoading } = useWebhookSubscription(space.id);
  const { showMessage } = useSnackbar();

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isDirty, isSubmitting }
  } = useForm<FormValues>({
    mode: 'onChange',
    resolver: yupResolver(schema)
  });

  useEffect(() => {
    if (spaceWebhook === undefined) {
      return; // loading
    }

    const data = {
      webhookUrl: spaceWebhook.webhookSubscriptionUrl,
      events: {
        discussion: spaceWebhook.eventMap.get('discussion') || false,
        proposal: spaceWebhook.eventMap.get('proposal') || false,
        bounty: spaceWebhook.eventMap.get('bounty') || false
      }
    };

    reset(data);
  }, [spaceWebhook]);

  const [webhookUrl, events] = watch(['webhookUrl', 'events']);

  async function updateWebhookSubscription(subscription: FormValues) {
    if (!subscription.webhookUrl) {
      return;
    }

    try {
      await updateSpaceWebhook({
        webhookUrl: subscription.webhookUrl,
        events: subscription.events
      });
    } catch (err) {
      log.error('There was an error updating webhooks', err);
      showMessage((err as Error).message || 'Could not save form', 'error');
    }

    return false;
  }

  return (
    <>
      <Legend>API Key</Legend>
      <Typography variant='body1'>
        Request access to the charmverse API in our{' '}
        <Link href='https://discord.gg/ACYCzBGC2M' external target='_blank'>
          Discord Channel <LaunchIcon fontSize='small' />
        </Link>
      </Typography>
      <Legend>Webhook (beta)</Legend>
      <Typography variant='body1'>
        Subscribe to events in Charmverse using webhooks. You must provide us with an http endpoint which returns a 200
        response upon reception of the event.
      </Typography>
      <form
        onSubmit={(event) => {
          // stop propagation so it doesnt submit parent forms, like bounty editor
          event.stopPropagation();
          event.preventDefault();
          handleSubmit(updateWebhookSubscription as any)(event);
        }}
        style={{ margin: 'auto' }}
      >
        <Grid item container xs mt={2}>
          <Grid item xs={10}>
            <InputLabel>Events Webhook</InputLabel>
            <TextField
              {...register('webhookUrl', { required: true })}
              type='text'
              size='small'
              disabled={!isAdmin}
              fullWidth
              error={!!errors.webhookUrl?.message}
              helperText={errors.webhookUrl?.message}
              placeholder='https://your-api.com/webhook'
            />
            {errors?.webhookUrl && <Alert severity='error'>Invalid webhook url</Alert>}
          </Grid>
          {spaceWebhook?.webhookSigningSecret && isAdmin && (
            <Grid item xs={10} mt={2}>
              <InputLabel>Webhook Signature Secret</InputLabel>
              <TextField
                type='text'
                size='small'
                disabled={true}
                fullWidth
                value={spaceWebhook?.webhookSigningSecret}
              />
            </Grid>
          )}
        </Grid>
        {webhookUrl && (
          <Grid item container xs mt={2}>
            <FormGroup>
              <FormControlLabel
                control={
                  <Switch
                    {...register('events.discussion', { required: true })}
                    checked={events.discussion}
                    disabled={!isAdmin}
                  />
                }
                label='Forum'
              />
              <FormControlLabel
                control={
                  <Switch
                    {...register('events.proposal', { required: true })}
                    checked={events.proposal}
                    disabled={!isAdmin}
                  />
                }
                label='Proposal'
              />
              <FormControlLabel
                control={
                  <Switch
                    {...register('events.bounty', { required: true })}
                    checked={events.bounty}
                    disabled={!isAdmin}
                  />
                }
                label='Bounty'
              />
            </FormGroup>
          </Grid>
        )}
        {isAdmin && (
          <Grid item container xs mt={2}>
            <Grid item xs mt={2}>
              <Grid item mt={2}>
                <Button
                  type='submit'
                  variant='contained'
                  color='primary'
                  sx={{ mr: 1 }}
                  disabled={isLoading || !isDirty || isSubmitting}
                >
                  Save
                </Button>
              </Grid>
            </Grid>
          </Grid>
        )}
      </form>
    </>
  );
}
