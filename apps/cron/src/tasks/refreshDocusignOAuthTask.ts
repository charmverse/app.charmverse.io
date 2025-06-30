import { prisma } from '@charmverse/core/prisma-client';
import { log } from '@packages/core/log';
import { refreshDocusignAccessToken } from '@packages/lib/docusign/authentication';

export async function refreshDocusignOAuthTask() {
  log.debug('Running Docusign credential refresh cron job');

  const docusignCredentials = await prisma.docusignCredential.findMany({
    select: {
      refreshToken: true,
      spaceId: true
    }
  });

  for (const docusignOAuth of docusignCredentials) {
    try {
      await refreshDocusignAccessToken({
        refreshToken: docusignOAuth.refreshToken
      });
    } catch (error: any) {
      log.error(`Error refreshing docusign credentials for space ${error.stack || error.message || error}`, {
        error,
        spaceId: docusignOAuth.spaceId
      });
    }
  }

  log.info(`Refreshed ${docusignCredentials.length} docusign credentials`);
}

// refreshDocusignOAuthTask().then(console.log).catch(console.error);
