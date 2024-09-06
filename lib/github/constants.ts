import env from '@beam-australia/react-env';
import { isProdEnv } from '@root/config/constants';

export const INSTALLATION_ID_COOKIE = 'github-installation-id';

export const SQS_WEBHOOK_GITHUB_QUEUE_NAME = isProdEnv
  ? 'https://sqs.us-east-1.amazonaws.com/310849459438/prd-webhook-github'
  : 'https://sqs.us-east-1.amazonaws.com/310849459438/stg-webhook-github';

export const GITHUB_APP_NAME = isProdEnv ? 'charmverse-integration' : 'dev-charmverse-integration';

export const GITHUB_GRAPHQL_BASE_URL = 'https://api.github.com/graphql';

export const GITHUB_API_BASE_URL = 'https://api.github.com';

// Github Secrets
// console.log('VALUES', {
//   client: env('GITHUB_CLIENT_ID'),
//   server: process.env.GITHUB_CLIENT_ID
// });
export const GITHUB_CLIENT_ID = env('GITHUB_CLIENT_ID') ?? process.env.REACT_APP_GITHUB_CLIENT_ID;

export const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;
