import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

export const webhookEndpoint = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    const body = event?.body;
    const headers = event?.headers;

    // eslint-disable-next-line no-console
    console.log('BODY', JSON.stringify(body));

    // eslint-disable-next-line no-console
    console.log('HEADERS', JSON.stringify(headers));

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true
      })
    };
  } catch (e) {
    return {
      statusCode: 500,
      body: JSON.stringify(e)
    };
  }
};
