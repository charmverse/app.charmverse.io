import { log } from '@charmverse/core/log';

import { refreshUnpaidApplications } from 'lib/applications/actions/refreshUnpaidApplications';
import { count } from 'lib/metrics';

export async function refreshBountyApplications() {
  log.debug('Running refresh unpaid applications statuses cron job');

  try {
    const { updatedApplicationsCount, totalCount } = await refreshUnpaidApplications();
    log.debug('Number of applications with pending payments', totalCount);
    log.debug('Number of udpated applications', updatedApplicationsCount);

    count('cron.token-gate-verification.total-applications-to-refresh', totalCount);
    count('cron.token-gate-verification.total-udpated-payment-statuses', updatedApplicationsCount);
  } catch (error: any) {
    log.error(`Error expiring proposals: ${error.stack || error.message || error}`, { error });
  }
}
