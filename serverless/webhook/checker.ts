import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

import log from 'lib/log';

export const webhookChecker = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const body = event?.body;
    const headers = event?.headers;

    // eslint-disable-next-line no-console
    log.debug('BODY', JSON.stringify(body));

    // eslint-disable-next-line no-console
    log.debug('HEADERS', JSON.stringify(headers));

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
