import { log } from '@charmverse/core/log';
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { jwtVerify } from 'jose';

export const webhookChecker = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const body = event?.body;
    const headers = event?.headers;

    log.debug('Webhook check: BODY', body);
    log.debug('Webhook check: HEADERS', headers);

    const signature = headers?.Signature || headers?.signature;

    if (!signature) {
      throw new Error('Checker: No signature found');
    }

    try {
      const tokenSecret = 'Checker: your_token_secret';
      const secret = Buffer.from(tokenSecret, 'hex');
      await jwtVerify(signature, secret);
    } catch (e) {
      throw new Error('Checker: Invalid signature');
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: true
      })
    };
  } catch (e) {
    log.error(e);

    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(e)
    };
  }
};
