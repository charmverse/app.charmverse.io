import { createHmac } from 'crypto';

import { prisma } from '@charmverse/core/prisma-client';
import type { components } from '@octokit/openapi-webhooks-types';
import type { WebhookMessageProcessResult } from '@root/lib/collabland/webhook/interfaces';

import { createRewardFromIssue } from './createRewardFromIssue';

type InstallationDeletedEvent = components['schemas']['webhook-installation-deleted'];
type IssuesLabeledEvent = components['schemas']['webhook-issues-labeled'];
type IssuesOpenedEvent = components['schemas']['webhook-issues-opened'];

type GithubWebhookPayload = {
  body: {
    [key: string]: any;
    action: string;
  };
  headers: {
    [key: string]: any;
    'X-Hub-Signature-256': string;
  };
};

type MessageHandlers = {
  labeled: (message: IssuesLabeledEvent) => Promise<WebhookMessageProcessResult>;
  opened: (message: IssuesOpenedEvent) => Promise<WebhookMessageProcessResult>;
  deleted: (message: InstallationDeletedEvent) => Promise<WebhookMessageProcessResult>;
};

const messageHandlers: MessageHandlers = {
  labeled: async (message) => {
    return createRewardFromIssue({
      message,
      createIssueComment: true
    });
  },

  opened: async (message) => {
    return createRewardFromIssue({
      message,
      createIssueComment: true
    });
  },

  deleted: async (message) => {
    const installationId = message.installation.id.toString();
    const space = await prisma.spaceGithubConnection.findFirst({
      where: {
        installationId
      },
      select: {
        spaceId: true
      }
    });

    if (!space) {
      return {
        success: true,
        message: `Installation ${installationId} not found.`
      };
    }

    await prisma.spaceGithubConnection.deleteMany({
      where: {
        installationId
      }
    });

    return {
      spaceId: space.spaceId,
      success: true,
      message: `Installation ${installationId} deleted.`
    };
  }
};

export async function processWebhookMessage(message: GithubWebhookPayload): Promise<WebhookMessageProcessResult> {
  const data = message?.body;
  const action = data?.action as keyof MessageHandlers;

  if (!messageHandlers[action]) {
    // we cannot process this message, just remove from queue
    return {
      success: true,
      message: `Unsupported action payload: ${action || 'undefined'}`
    };
  }

  const hasPermission = await verifyWebhookMessagePermission(message);
  if (!hasPermission) {
    return {
      success: true,
      message: 'Webhook message without permission to be parsed.'
    };
  }

  const handler = messageHandlers[action];
  return handler(data as any);
}

export async function verifyWebhookMessagePermission(message: GithubWebhookPayload) {
  const xHubSignature256 = message.headers['X-Hub-Signature-256'];
  if (!xHubSignature256) {
    return false;
  }
  const hmac = createHmac('sha256', process.env.GITHUB_APP_WEBHOOK_SECRET!);
  const digest = `sha256=${hmac.update(JSON.stringify(message.body)).digest('hex')}`;

  return xHubSignature256 === digest;
}
