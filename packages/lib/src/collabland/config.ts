import { isProdEnv } from '@packages/config/constants';

export const COLLAB_API_KEY = process.env.COLLAB_API_KEY as string | undefined;
export const COLLABLAND_API_URL =
  process.env.COLLABLAND_API_URL || isProdEnv ? 'https://api.collab.land' : 'https://api-qa.collab.land';
export const SQS_WEBHOOK_COLLABLAND_QUEUE_NAME = isProdEnv
  ? `https://sqs.us-east-1.amazonaws.com/310849459438/prd-webhook-collabland.fifo`
  : 'https://sqs.us-east-1.amazonaws.com/310849459438/stg-webhook-collabland.fifo';
