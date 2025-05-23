import { log } from '@charmverse/core/log';
import type { Space } from '@charmverse/core/prisma';
import { yupResolver } from '@hookform/resolvers/yup';
import LaunchIcon from '@mui/icons-material/LaunchOutlined';
import { Alert, FormControlLabel, FormGroup, Grid, InputLabel, Stack, Switch, TextField } from '@mui/material';
import Typography from '@mui/material/Typography';
import { getApiAccessStringifiedTiers, hasApiAccess } from '@packages/subscriptions/featureRestrictions';
import { isUrl } from '@packages/utils/strings';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';

import charmClient from 'charmClient';
import { useTrackPageView } from 'charmClient/hooks/track';
import { Button } from 'components/common/Button';
import Link from 'components/common/Link';
import { useIsAdmin } from 'hooks/useIsAdmin';
import { useSettingsDialog } from 'hooks/useSettingsDialog';
import { useSnackbar } from 'hooks/useSnackbar';
import useWebhookSubscription from 'hooks/useSpaceWebhook';

import Legend from '../components/Legend';
import { UpgradeChip } from '../subscription/UpgradeWrapper';

export const schema = yup.object({
  webhookUrl: yup.string().nullable(),
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
  const apiAccess = hasApiAccess(space.subscriptionTier);
  const { openUpgradeSubscription } = useSettingsDialog();
  const [isTestingWebhook, setIsTestingWebhook] = useState(false);

  useTrackPageView({ type: 'settings/api' });

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

  async function testSpaceWebhook() {
    if (!webhookUrl) {
      return;
    }

    try {
      setIsTestingWebhook(true);
      const { status } = await charmClient.testSpaceWebhook({
        spaceId: space.id,
        webhookUrl
      });

      if (status === 200) {
        showMessage('Webhook successfully sent - Status 200', 'success');
      } else {
        showMessage(`Webhook failed to send - Status ${status}`, 'error');
      }
    } catch (err) {
      log.error('There was an error sending test webhook', err);
      showMessage('Webhook failed to send', 'error');
    } finally {
      setIsTestingWebhook(false);
    }
  }

  return (
    <>
      <Legend sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        API Settings <UpgradeChip upgradeContext='api_access' />
      </Legend>
      <Typography variant='h6' sx={{ display: 'flex', alignContent: 'center', gap: 1 }}>
        API Endpoints
      </Typography>
      <Typography>
        Our API endpoints enable you to access and create content in your space. View the{' '}
        <Link href='/api-docs' target='_blank'>
          documentation
        </Link>{' '}
        to see what is currently supported.
        <br />
        <br />
        {apiAccess ? (
          <>
            Get started by requesting an API key in our{' '}
            <Link href='https://discord.gg/ACYCzBGC2M' external target='_blank'>
              Discord Channel <LaunchIcon fontSize='small' />
            </Link>
          </>
        ) : (
          <Alert severity='warning'>
            You need to upgrade your subscription to {getApiAccessStringifiedTiers()} tier to use the API. Click{' '}
            <span style={{ cursor: 'pointer', textDecoration: 'underline' }} onClick={openUpgradeSubscription}>
              here
            </span>{' '}
            to upgrade.
          </Alert>
        )}
      </Typography>
      <br />
      <Typography variant='h6'>Webhook (beta)</Typography>
      <Typography>
        Subscribe to user events in CharmVerse using webhooks. You must provide us with a http endpoint accepting POST
        requests which returns a 200 response upon reception of the event.
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
              <Stack flexDirection='row' gap={1}>
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
                {spaceWebhook?.webhookSigningSecret && (
                  <Button
                    disabled={!webhookUrl || isLoading || isSubmitting || isTestingWebhook || !isUrl(webhookUrl)}
                    onClick={testSpaceWebhook}
                  >
                    Test
                  </Button>
                )}
              </Stack>
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
                  label='Reward'
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
                    disabled={isLoading || !isDirty || isSubmitting || !webhookUrl}
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
