import { log } from '@packages/core/log';
import { verifyTokenGateMemberships } from '@packages/lib/tokenGates/verifyTokenGateMemberships';
import { count } from '@packages/metrics';

export async function task() {
  log.debug('Running Verify Token Gate memberships cron job');

  try {
    const results = await verifyTokenGateMemberships();
    log.debug('Number of members removed due to invalid token gate conditions', String(results.removedMembers));
    log.debug('Number of user roles removed due to invalid token gate conditions', String(results.removedRoles));

    count('cron.token-gate-verification.removed-members', results.removedMembers);
    count('cron.token-gate-verification.removed-member-roles', results.removedRoles);
  } catch (error: any) {
    log.error(`Error verifying token gate memberships: ${error.stack || error.message || error}`, { error });
  }
}
