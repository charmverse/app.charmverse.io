import { isProdEnv } from '@packages/config/constants';
import formData from 'form-data';
import Mailgun from 'mailgun.js';

export const API_KEY = process.env.MAILGUN_API_KEY as string | undefined;
export const SIGNING_KEY = process.env.MAILGUN_SIGNING_KEY as string;
export const DOMAIN = process.env.MAILGUN_DOMAIN as string;
export const SENDER_ADDRESS = `CharmVerse <replies@${DOMAIN}>`;
export const SQS_WEBHOOK_MAILGUN_QUEUE_NAME = isProdEnv
  ? 'https://sqs.us-east-1.amazonaws.com/310849459438/prd-webhook-mailgun'
  : 'https://sqs.us-east-1.amazonaws.com/310849459438/stg-webhook-mailgun';

const mailgun = new Mailgun(formData);
const client = API_KEY && API_KEY !== 'test-key' ? mailgun.client({ username: 'api', key: API_KEY }) : null;

export default client;
