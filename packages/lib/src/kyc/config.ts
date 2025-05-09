import { isProdEnv } from '@packages/config/constants';

// Synaps
export const synapsUrl = 'https://api.synaps.io/v4' as const;
export const SQS_WEBHOOK_SYNAPS_QUEUE_NAME = isProdEnv
  ? `https://sqs.us-east-1.amazonaws.com/310849459438/prd-webhook-synaps`
  : 'https://sqs.us-east-1.amazonaws.com/310849459438/stg-webhook-synaps';

// Persona
export const personaUrl = 'https://withpersona.com/api/v1' as const;
export const personaVersion = '2023-01-05' as const;
export const SQS_WEBHOOK_PERSONA_QUEUE_NAME = isProdEnv
  ? `https://sqs.us-east-1.amazonaws.com/310849459438/prd-webhook-persona`
  : 'https://sqs.us-east-1.amazonaws.com/310849459438/stg-webhook-persona';
