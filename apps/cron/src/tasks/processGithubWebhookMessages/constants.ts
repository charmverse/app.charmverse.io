import { isProdEnv } from '@packages/config/constants';

export const SQS_WEBHOOK_GITHUB_QUEUE_NAME = isProdEnv
  ? 'https://sqs.us-east-1.amazonaws.com/310849459438/prd-webhook-github'
  : 'https://sqs.us-east-1.amazonaws.com/310849459438/stg-webhook-github';
