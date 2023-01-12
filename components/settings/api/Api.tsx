import { yupResolver } from '@hookform/resolvers/yup';
import LaunchIcon from '@mui/icons-material/LaunchOutlined';
import { Alert, Button, FormControlLabel, FormGroup, Grid, InputLabel, Switch, TextField } from '@mui/material';
import Typography from '@mui/material/Typography';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';

import Link from 'components/common/Link';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import useWebhookSubscription from 'hooks/useSpaceWebhook';
import type { ISystemError } from 'lib/utilities/errors';

import Legend from '../Legend';

interface Props {
  isAdmin: boolean;
  spaceId: string;
  spaceOwner: string;
}

export const schema = yup.object({
  webhookURL: yup.string().nullable(true),
  discussion: yup.boolean().nullable(true),
  comment: yup.boolean().nullable(true),
  proposal: yup.boolean(),
  bounty: yup.boolean()
});

type FormValues = yup.InferType<typeof schema>;

export default function Api({ isAdmin, spaceId, spaceOwner }: Props) {
  const space = useCurrentSpace();
  const [formError, setFormError] = useState<ISystemError | null>(null);
  const { updateSpaceWebhookUrl } = useWebhookSubscription(spaceId);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isValid }
  } = useForm<FormValues>({
    mode: 'onChange',
    defaultValues: {
      webhookURL: space?.webhookSubscriptionUrl
    },
    resolver: yupResolver(schema)
  });

  const [webhookUrl] = watch(['webhookURL']);

  async function updateWebhookSubscription(subscription: FormValues) {
    const promises: Promise<any>[] = [];
    setFormError(null);

    if (subscription.webhookURL) {
      promises.push(updateSpaceWebhookUrl(subscription.webhookURL));
    }

    try {
      await Promise.all(promises);
    } catch (err) {
      log.error('There was an error updating', err);
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
      <Legend>Webhook</Legend>
      <Typography variant='body1'>
        Subscribe to Charmverse's event using webhooks. You must provide us with an http endpoint which returns a 200
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
            <InputLabel>Webhook URL</InputLabel>
            <TextField
              {...register('webhookURL')}
              type='text'
              size='small'
              fullWidth
              error={!!errors.webhookURL?.message}
              helperText={errors.webhookURL?.message}
              placeholder='https://your-api.com/webhook'
            />
            {errors?.webhookURL && <Alert severity='error'>Invalid webhook url</Alert>}
          </Grid>
        </Grid>
        {webhookUrl && (
          <Grid item container xs mt={2}>
            <FormGroup>
              <FormControlLabel control={<Switch defaultChecked />} label='Discussion' />
              <FormControlLabel control={<Switch defaultChecked />} label='Comment' />
              <FormControlLabel control={<Switch defaultChecked />} label='Proposal' />
              <FormControlLabel control={<Switch defaultChecked />} label='Bounty' />
            </FormGroup>
          </Grid>
        )}
        {isAdmin && (
          <Grid item container xs mt={2}>
            <Grid item xs mt={2}>
              <Button type='submit' variant='contained' color='secondary' sx={{ mr: 1 }}>
                Test
              </Button>
            </Grid>
            <Grid item mt={2}>
              <Button type='submit' variant='contained' color='primary' sx={{ mr: 1 }}>
                Save
              </Button>
            </Grid>
          </Grid>
        )}
      </form>
    </>
  );
}
