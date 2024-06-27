import type { DocusignCredential } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { v4 as uuid } from 'uuid';

import { GET, POST } from 'adapters/http';

import type { RequiredDocusignCredentials } from './constants';
import { getSpaceDocusignCredentials } from './getSpaceDocusignCredentials';
import { docusignUserOAuthTokenHeader } from './headers';

// Change this to match the base url in prod
const webhookBaseUrl = 'https://1bd8-2001-861-3385-87c0-b5ea-9099-6827-716e.ngrok-free.app';
// const webhookBaseUrl = baseUrl;

async function getDocusignWebhook({
  docusignWebhookId,
  docusignAccountId,
  docusignAuthToken,
  docusignBaseUrl
}: {
  docusignWebhookId: string;
  docusignAccountId: string;
  docusignAuthToken: string;
  docusignBaseUrl: string;
}): Promise<any> {
  return GET<{ configurations: any[] }>(
    `${docusignBaseUrl}/restapi/v2.1/accounts/${docusignAccountId}/connect/${docusignWebhookId}`,
    undefined,
    {
      headers: docusignUserOAuthTokenHeader({ accessToken: docusignAuthToken })
    }
  );
}

/**
 * Full structure of webhook events
 * https://developers.docusign.com/platform/webhooks/connect/json-sim-event-model/
 *
 * Full config of the webhook
 * https://developers.docusign.com/docs/esign-rest-api/reference/connect/connectconfigurations/create/
 */
export async function createSpaceDocusignWebhook({ spaceId }: { spaceId: string }): Promise<DocusignCredential> {
  let credentials = await getSpaceDocusignCredentials({ spaceId });

  if (!credentials.webhookApiKey) {
    credentials = await prisma.docusignCredential.update({
      where: {
        id: credentials.id
      },
      data: {
        webhookApiKey: uuid()
      }
    });
  }

  const webhookUrl = `${webhookBaseUrl}/api/v1/webhooks/docusign/${credentials.webhookApiKey}`;

  const createdWebhook = await POST<any>(
    `${credentials.docusignApiBaseUrl}/restapi/v2.1/accounts/${credentials.docusignAccountId}/connect`,
    {
      configurationType: 'custom',
      urlToPublishTo: webhookUrl,
      allUsers: true,
      name: 'CharmVerse',
      deliveryMode: 'SIM',
      requiresAcknowledgement: 'true',
      allowEnvelopePublish: 'true',
      enableLog: 'true',
      eventData: {
        version: 'restv2.1'
      },
      includeData: ['recipients'],
      events: ['envelope-completed', 'recipient-completed']
    },
    {
      headers: docusignUserOAuthTokenHeader({ accessToken: credentials.accessToken })
    }
  );

  return prisma.docusignCredential.update({
    where: {
      id: credentials.id
    },
    data: {
      docusignWebhookId: createdWebhook.connectId
    }
  });
}

export async function ensureSpaceWebhookExists({
  spaceId,
  credentials
}: {
  spaceId: string;
  credentials?: RequiredDocusignCredentials & Pick<DocusignCredential, 'docusignWebhookId' | 'id'>;
}): Promise<DocusignCredential> {
  credentials = credentials ?? (await getSpaceDocusignCredentials({ spaceId }));

  if (credentials.docusignWebhookId) {
    const webhook = await getDocusignWebhook({
      docusignWebhookId: credentials.docusignWebhookId,
      docusignAccountId: credentials.docusignAccountId,
      docusignAuthToken: credentials.accessToken,
      docusignBaseUrl: credentials.docusignApiBaseUrl
    });

    if (!webhook?.configurations.length) {
      await prisma.docusignCredential.update({
        where: {
          id: credentials.id
        },
        data: {
          docusignWebhookId: null
        }
      });
      await createSpaceDocusignWebhook({ spaceId });
    }
  } else {
    await createSpaceDocusignWebhook({ spaceId });
  }

  return getSpaceDocusignCredentials({ spaceId });
}
