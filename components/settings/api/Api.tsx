import { log } from '@charmverse/core/log';
import type { Space } from '@charmverse/core/prisma';
import { yupResolver } from '@hookform/resolvers/yup';
import LaunchIcon from '@mui/icons-material/LaunchOutlined';
import { Alert, Button, FormControlLabel, FormGroup, Grid, InputLabel, Switch, TextField } from '@mui/material';
import Typography from '@mui/material/Typography';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';

import Link from 'components/common/Link';
import { useIsAdmin } from 'hooks/useIsAdmin';
import { useSnackbar } from 'hooks/useSnackbar';
import useWebhookSubscription from 'hooks/useSpaceWebhook';

import Legend from '../Legend';

export const schema = yup.object({
  webhookUrl: yup.string().nullable(true),
  events: yup
    .object({
      forum: yup.boolean().defined(),
      user: yup.boolean().defined(),
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

  const [webhookUrl, events] = watch(['webhookUrl', 'events']);

  useEffect(() => {
    if (spaceWebhook === undefined) {
      return; // loading
    }

    const data = {
      webhookUrl: spaceWebhook.webhookSubscriptionUrl,
      events: {
        forum: spaceWebhook.eventMap.get('forum') || false,
        proposal: spaceWebhook.eventMap.get('proposal') || false,
        bounty: spaceWebhook.eventMap.get('bounty') || false,
        user: spaceWebhook.eventMap.get('user') || false
      }
    };

    reset(data);
  }, [spaceWebhook]);
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
      <Legend>API Settings</Legend>
      <Typography variant='h6'>API Endpoints</Typography>
      <Typography>
        Our API endpoints enable you to access and create content in your space. View the{' '}
        <Link href='/api-docs' target='_blank'>
          documentation
        </Link>{' '}
        to see what is currently supported.
        <br />
        <br />
        Get started by requesting an API key in our{' '}
        <Link href='https://discord.gg/ACYCzBGC2M' external target='_blank'>
          Discord Channel <LaunchIcon fontSize='small' />
        </Link>
      </Typography>
      <br />
      <Typography variant='h6'>Webhook (beta)</Typography>
      <Typography>
        Subscribe to user events in CharmVerse using webhooks. You must provide us with an http endpoint which returns a
        200 response upon reception of the event.
      </Typography>
      {spaceWebhook && events && (
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
                data-test='webhook-url-input'
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
                  data-test='webhook-signing-secret'
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
                      {...register('events.forum', { required: true })}
                      data-test='enable-forum-switch'
                      checked={events.forum}
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
                      data-test='enable-proposal-switch'
                      disabled={!isAdmin}
                    />
                  }
                  label='Proposal'
                />
                <FormControlLabel
                  control={
                    <Switch
                      {...register('events.bounty', { required: true })}
                      data-test='enable-bounty-switch'
                      checked={events.bounty}
                      disabled={!isAdmin}
                    />
                  }
                  label='Bounty'
                />
                <FormControlLabel
                  control={
                    <Switch
                      {...register('events.user', { required: true })}
                      checked={events.user}
                      disabled={!isAdmin}
                      data-test='enable-user-switch'
                    />
                  }
                  label='Members'
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
                    data-test='submit'
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
      )}
    </>
  );
}
