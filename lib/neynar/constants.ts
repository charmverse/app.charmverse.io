import { isProdEnv } from '@root/config/constants';

export const SQS_WEBHOOK_NEYNAR_QUEUE_NAME = isProdEnv
  ? 'https://sqs.us-east-1.amazonaws.com/310849459438/prd-webhook-neynar'
  : 'https://sqs.us-east-1.amazonaws.com/310849459438/stg-webhook-neynar';
