import { prisma } from '@charmverse/core/dist/cjs/prisma-client';

import { GET } from 'adapters/http';
import { baseUrl } from 'config/constants';

export async function getDocusignWebhook({ docusignWebhookId }: { docusignWebhookId: string }): Promise<any> {
  return GET<any>(`${baseUrl}/api/v1/docusign/webhooks/${docusignWebhookId}`);
}

export async function connectSpaceToDocusign({ spaceId }: { spaceId: string }) {
  const credentials = await prisma.docusignCredential.findFirstOrThrow({
    where: {
      spaceId
    },
    select: {
      id: true,
      docusignAccountId: true,
      accessToken: true
    }
  });

  const webhookUri = `${baseUrl}/api/v1/docusign/callback`;
}
