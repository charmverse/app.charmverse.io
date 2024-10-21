import formData from 'form-data';
import Mailgun from 'mailgun.js';

export const API_KEY = process.env.MAILGUN_API_KEY as string | undefined;
export const DOMAIN = process.env.MAILGUN_DOMAIN as string;
const mailgun = new Mailgun(formData);
const client = API_KEY && API_KEY !== 'test-key' ? mailgun.client({ username: 'api', key: API_KEY }) : null;

export default client;
