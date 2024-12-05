import { log } from '@charmverse/core/log';
import Router from '@koa/router';
import Koa from 'koa';
import { DateTime } from 'luxon';

import * as middleware from './middleware';
import { alertLowWalletGasBalance } from './tasks/alertLowWalletGasBalance';
import { issueGemsOnchain } from './tasks/issueGemsOnchain';
import { processAllBuilderActivity } from './tasks/processBuilderActivity';
import { processGemsPayout } from './tasks/processGemsPayout';
import { processOnchainGemsPayout } from './tasks/processGemsPayout/processOnchainGemsPayout';
import { processNftMints } from './tasks/processNftMints';
import { sendNotifications } from './tasks/pushNotifications/sendNotifications';
import { refreshShareImagesTask } from './tasks/refreshShareImages';
import { resolveBalanceIssues } from './tasks/resolveBalanceIssues/resolveBalanceIssues';
import { resolveMissingPurchasesTask } from './tasks/resolveMissingPurchases';
import { updateAllBuilderCardActivities } from './tasks/updateBuilderCardActivity';
import { updateMixpanelUserProfilesTask } from './tasks/updateMixpanelProfilesTask';
import { updateTalentMoxieProfiles } from './tasks/updateTalentMoxieProfiles';

const app = new Koa();
const router = new Router();

// add a task endpoint which will be configured in cron.yml
function addTask(path: string, handler: (ctx: Koa.Context) => any) {
  router.post(path, async (ctx) => {
    // just in case we need to disable cron in production
    if (process.env.DISABLE_CRON === 'true') {
      log.info(`${path}: Cron disabled, skipping`);
      return;
    }
    const timer = DateTime.now();
    log.info(`${path}: Task triggered`, { body: ctx.body, headers: ctx.headers });

    try {
      const result = await handler(ctx);

      log.info(`${path}: Completed task`, { durationMinutes: timer.diff(DateTime.now(), 'minutes') });

      ctx.body = result || { success: true };
    } catch (error) {
      log.error(`${path}: Error processing task`, {
        durationMinutes: timer.diff(DateTime.now(), 'minutes'),
        error
      });
      throw error;
    }
  });
}

addTask('/hello-world', (ctx) => {
  log.info('Hello World triggered', { body: ctx.body, headers: ctx.headers });
});

addTask('/process-builder-activity', processAllBuilderActivity);

addTask('/send-push-notifications', sendNotifications);

addTask('/process-gems-payout', processGemsPayout);

addTask('/process-nft-mints', processNftMints);

addTask('/update-mixpanel-user-profiles', updateMixpanelUserProfilesTask);

addTask('/alert-low-wallet-gas-balance', alertLowWalletGasBalance);

addTask('/update-builder-card-activity', updateAllBuilderCardActivities);

addTask('/resync-nft-purchases', resolveMissingPurchasesTask);

addTask('/resolve-balance-issues', resolveBalanceIssues);

addTask('/refresh-nft-share-images', refreshShareImagesTask);

// Standard health check used by Beanstalk
// Onchain tasks -------

// Calculate merkle tree and write to protocol
addTask('/process-onchain-gems-payout', processOnchainGemsPayout);

// Issue receipts for Github Activity via EAS
addTask('/issue-gems-onchain', issueGemsOnchain);

addTask('/update-talent-moxie-profiles', updateTalentMoxieProfiles);

// Standard health check used by Beanstalk -------
router.get('/api/health', middleware.healthCheck);

app.use(middleware.errorHandler).use(router.routes()).use(router.allowedMethods());

export default app;
